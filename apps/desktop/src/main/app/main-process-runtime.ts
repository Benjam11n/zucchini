import type { App, Dialog, IpcMain, Shell, Session } from "electron";
import { nativeImage, globalShortcut } from "electron";
import type { AppUpdater } from "electron-updater";

import { resolveRuntimeIconPath } from "@/main/app/assets";
import { createAutoBackupService } from "@/main/app/auto-backup";
import { createDataManagementActions } from "@/main/app/data-management";
import { ElectronLifecycleController } from "@/main/app/electron-lifecycle-controller";
import { createFatalErrorReporter } from "@/main/app/fatal-error";
import { createFocusTimerGlobalShortcutManager } from "@/main/app/global-shortcuts";
import type { LoggerPort } from "@/main/app/ports";
import { applyRuntimeSettings, createAppRuntime } from "@/main/app/runtime";
import type { AppRuntime } from "@/main/app/runtime";
import {
  captureMarketingScreenshot,
  getScreenshotModeConfig,
  isScreenshotMode,
  seedMarketingScreenshotData,
} from "@/main/app/screenshot-mode";
import { configureSessionSecurity } from "@/main/app/session-security";
import { registerUpdaterRuntime } from "@/main/app/updater-runtime";
import { WindowCoordinator } from "@/main/app/window-coordinator";
import { createFocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";
import { registerIpcHandlers } from "@/main/infra/ipc/handlers";
import { SqliteAppRepository } from "@/main/infra/persistence/sqlite-app-repository";
import { systemClock } from "@/shared/domain/clock";
import type { AppSettings } from "@/shared/domain/settings";

interface MainProcessRuntimeOptions {
  app: App;
  autoUpdater: AppUpdater;
  dialog: Dialog;
  getDefaultSession: () => Session;
  ipcMain: IpcMain;
  logger: LoggerPort;
  shell: Shell;
}

interface ScreenshotDatabasePathOptions {
  screenshotConfig: ReturnType<typeof getScreenshotModeConfig>;
  screenshotMode: boolean;
}

export function resolveScreenshotDatabasePath({
  screenshotConfig,
  screenshotMode,
}: ScreenshotDatabasePathOptions): string | null {
  if (!screenshotMode) {
    return null;
  }

  return screenshotConfig.databasePath;
}

export class MainProcessRuntime {
  private isQuitting = false;
  private trayEnabled = false;
  private appRuntime: AppRuntime | null = null;
  private runAutoBackupIfDue: ((settings: AppSettings) => void) | null = null;

  private readonly focusTimerCoordinator = createFocusTimerCoordinator();
  private readonly windowCoordinator = new WindowCoordinator({
    getIsQuitting: () => this.isQuitting,
    getTrayEnabled: () => this.trayEnabled,
  });
  private readonly focusTimerGlobalShortcutManager =
    createFocusTimerGlobalShortcutManager({
      globalShortcut,
      onAction: (action) =>
        this.windowCoordinator.dispatchFocusTimerAction({
          action,
          source: "global-shortcut",
        }),
    });
  private readonly lifecycleController: ElectronLifecycleController;
  private readonly options: MainProcessRuntimeOptions;

  constructor(options: MainProcessRuntimeOptions) {
    this.options = options;
    this.lifecycleController = new ElectronLifecycleController({
      app: this.options.app,
      bootstrap: () => {
        void this.bootstrapApp();
      },
      cleanup: () => this.cleanupRuntime(),
      getTrayEnabled: () => this.trayEnabled,
      isScreenshotMode,
      markQuitting: () => this.markQuitting(),
      onActivate: () => this.windowCoordinator.showMainWindow(),
      onResume: () => this.handleResume(),
      showMainWindowWhenReady: () => {
        void this.showMainWindowWhenReady();
      },
    });
  }

  start(): void {
    this.registerFatalErrorHandlers();
    this.lifecycleController.start();
  }

  private async bootstrapApp(): Promise<void> {
    try {
      await this.options.app.whenReady();
      configureSessionSecurity(
        this.options.getDefaultSession(),
        this.options.logger
      );

      const screenshotMode = isScreenshotMode();
      const screenshotConfig = screenshotMode
        ? getScreenshotModeConfig()
        : null;
      const screenshotDatabasePath = resolveScreenshotDatabasePath({
        screenshotConfig: screenshotConfig ?? {
          databasePath: null,
          outputPath: null,
          userDataPath: null,
        },
        screenshotMode,
      });
      const screenshotRepository = screenshotDatabasePath
        ? new SqliteAppRepository({
            databasePath: screenshotDatabasePath,
          })
        : null;
      const appRuntime = createAppRuntime({
        onOpenFocusWidget: () => this.windowCoordinator.showFocusWidget(),
        onOpenMainWindow: () => this.windowCoordinator.showMainWindow(),
        onOpenWindDown: () => this.windowCoordinator.showWindDown(),
        onQuit: () => {
          this.markQuitting();
          this.options.app.quit();
        },
        ...(screenshotRepository ? { repository: screenshotRepository } : {}),
      });
      this.appRuntime = appRuntime;
      seedMarketingScreenshotData({
        repository: appRuntime.repository,
        service: appRuntime.service,
      });

      this.configureDockIcon();

      const dataManagement = createDataManagementActions({
        app: this.options.app,
        clock: systemClock,
        dialog: this.options.dialog,
        repository: appRuntime.repository,
        service: appRuntime.service,
        shell: this.options.shell,
      });
      const autoBackup = createAutoBackupService({
        clock: systemClock,
        log: this.options.logger,
        repository: appRuntime.repository,
        shell: this.options.shell,
      });
      this.runAutoBackupIfDue = (settings) => {
        void autoBackup.runIfDue(settings);
      };

      registerIpcHandlers({
        broadcastFocusSessionRecorded: (session) =>
          this.windowCoordinator.broadcastFocusSessionRecorded(session),
        broadcastFocusTimerStateChanged: (state) =>
          this.windowCoordinator.broadcastFocusTimerStateChanged(state),
        focusTimerCoordinator: this.focusTimerCoordinator,
        getFocusTimerShortcutStatus: () =>
          this.focusTimerGlobalShortcutManager.getStatus(),
        onChooseBackupForRestore: dataManagement.chooseBackupForRestore,
        onClearData: () =>
          dataManagement.clearData(() => {
            this.markQuitting();
          }),
        onExportBackup: dataManagement.exportBackup,
        onExportCsvData: dataManagement.exportCsvData,
        onGetLatestAutoBackupRestorePreview:
          dataManagement.getLatestAutoBackupRestorePreview,
        onImportBackup: () =>
          dataManagement.importBackup(() => {
            this.markQuitting();
          }),
        onOpenAutoBackupFolder: autoBackup.openBackupFolder,
        onOpenDataFolder: dataManagement.openDataFolder,
        onResizeFocusWidget: (width, height) =>
          this.windowCoordinator.resizeFocusWidget(width, height),
        onRestoreBackup: (restoreId) =>
          dataManagement.restoreBackup(restoreId, () => {
            this.markQuitting();
          }),
        onSettingsChanged: (settings) => {
          this.applySettings(appRuntime, settings);
          void autoBackup.runIfDue(settings);
        },
        onShowFocusWidget: () => this.windowCoordinator.showFocusWidget(),
        onShowMainWindow: () => this.windowCoordinator.showMainWindow(),
        onWindDownChanged: (todayState) => {
          appRuntime.reminders.schedule(todayState.settings);
        },
        service: appRuntime.service,
      });

      const updaterController = registerUpdaterRuntime({
        app: this.options.app,
        autoUpdater: this.options.autoUpdater,
        broadcastState: (state) =>
          this.windowCoordinator.broadcastUpdateState(state),
        ipcMain: this.options.ipcMain,
        log: this.options.logger,
      });

      const mainWindow = this.windowCoordinator.ensureMainWindow();

      if (screenshotMode) {
        await captureMarketingScreenshot({
          app: this.options.app,
          log: this.options.logger,
          window: mainWindow,
        });
        return;
      }

      this.windowCoordinator.ensureFocusWidgetWindow();
      queueMicrotask(() => {
        this.warmAppRuntime(appRuntime);
        try {
          void autoBackup.runIfDue(appRuntime.service.getTodayState().settings);
        } catch (error) {
          this.options.logger.error("Failed to start auto backup.", error);
        }
      });
      updaterController.start();
    } catch (error) {
      this.reportAppReadyFailure(error);
    }
  }

  private async showMainWindowWhenReady(): Promise<void> {
    try {
      await this.options.app.whenReady();
      this.windowCoordinator.showMainWindow();
    } catch (error) {
      this.reportAppReadyFailure(error);
    }
  }

  private handleResume(): void {
    const runtime = this.getRuntime();
    const { settings } = runtime.service.getTodayState();
    runtime.reminders.schedule(settings);
    this.runAutoBackupIfDue?.(settings);
  }

  private warmAppRuntime(nextRuntime: AppRuntime): void {
    try {
      const todayState = nextRuntime.service.getTodayState();
      this.applySettings(nextRuntime, todayState.settings);
    } catch (error) {
      this.options.logger.error("Failed to warm app runtime.", error);
    }
  }

  private applySettings(runtime: AppRuntime, settings: AppSettings): void {
    this.trayEnabled = applyRuntimeSettings({
      app: this.options.app,
      applyThemeMode: this.windowCoordinator.applyThemeMode,
      runtime,
      settings,
    });
    const status = this.focusTimerGlobalShortcutManager.register(settings);
    this.windowCoordinator.broadcastFocusTimerShortcutStatus(status);
  }

  private cleanupRuntime(): void {
    this.focusTimerGlobalShortcutManager.unregisterAll();

    if (!this.appRuntime) {
      return;
    }

    this.appRuntime.reminders.cancel();
    this.appRuntime.tray.destroy();
    this.appRuntime.repository.close();
  }

  private registerFatalErrorHandlers(): void {
    const reportFatalMainProcessError = createFatalErrorReporter({
      app: this.options.app,
      cleanup: () => this.cleanupRuntime(),
      dialog: this.options.dialog,
      log: this.options.logger,
    });

    process.on("uncaughtException", (error) => {
      reportFatalMainProcessError("uncaughtException", error);
    });

    process.on("unhandledRejection", (reason) => {
      reportFatalMainProcessError("unhandledRejection", reason);
    });
  }

  private configureDockIcon(): void {
    if (process.platform !== "darwin" || !this.options.app.dock) {
      return;
    }

    const icon = nativeImage.createFromPath(resolveRuntimeIconPath());
    if (!icon.isEmpty()) {
      this.options.app.dock.setIcon(icon);
    }
  }

  private getRuntime(): AppRuntime {
    if (!this.appRuntime) {
      throw new Error("App runtime is not initialized.");
    }

    return this.appRuntime;
  }

  private markQuitting(): void {
    this.isQuitting = true;
  }

  private reportAppReadyFailure(error: unknown): void {
    this.options.logger.error(
      "Failed while waiting for the Electron app to be ready.",
      error
    );
  }
}
