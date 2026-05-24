import type { BrowserWindow as BrowserWindowType } from "electron";
import { BrowserWindow } from "electron";

import { resolveRuntimeIconPath } from "@/main/app/assets";
import { shouldHideOnWindowClose } from "@/main/app/lifecycle";
import {
  applyWindowThemeMode,
  getWindowBackgroundColor,
} from "@/main/app/window-theme";
import { clampFocusWidgetBounds } from "@/main/app/windows/focus-widget-bounds";
import { createFocusWidgetWindow } from "@/main/app/windows/focus-widget-window";
import { createMainWindow } from "@/main/app/windows/main-window";
import type {
  FocusTimerActionRequest,
  FocusTimerShortcutStatus,
} from "@/shared/contracts/api/habits-api";
import { APP_UPDATER_CHANNELS } from "@/shared/contracts/app-updater";
import type { AppUpdateState } from "@/shared/contracts/app-updater";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/ipc/habits-channels";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";

interface WindowCoordinatorOptions {
  getAllWindows?: () => BrowserWindowType[];
  getIsQuitting: () => boolean;
  getTrayEnabled: () => boolean;
}

function positionFocusWidgetWindow(window: BrowserWindowType): void {
  const bounds = window.getBounds();
  window.setBounds(
    clampFocusWidgetBounds({
      height: bounds.height,
      width: bounds.width,
      x: bounds.x,
      y: bounds.y,
    })
  );
}

export class WindowCoordinator {
  private focusWidgetWindow: BrowserWindowType | null = null;
  private mainWindow: BrowserWindowType | null = null;
  private readonly options: Required<WindowCoordinatorOptions>;

  constructor(options: WindowCoordinatorOptions) {
    this.options = {
      ...options,
      getAllWindows:
        options.getAllWindows ?? (() => BrowserWindow.getAllWindows()),
    };
  }

  applyThemeMode = applyWindowThemeMode;

  ensureMainWindow(): BrowserWindowType {
    const existingWindow = this.getMainWindow();

    if (existingWindow) {
      return existingWindow;
    }

    const window = createMainWindow({
      backgroundColor: getWindowBackgroundColor(),
      getIsQuitting: this.options.getIsQuitting,
      iconPath: resolveRuntimeIconPath(),
      onClosed: () => this.clearMainWindow(window),
      shouldHideToTray: ({ isQuitting }) =>
        shouldHideOnWindowClose({
          isQuitting,
          trayEnabled: this.options.getTrayEnabled(),
        }),
    });

    this.mainWindow = window;
    return window;
  }

  ensureFocusWidgetWindow(): BrowserWindowType {
    const existingWindow = this.getFocusWidgetWindow();

    if (existingWindow) {
      return existingWindow;
    }

    const window = createFocusWidgetWindow({
      getIsQuitting: this.options.getIsQuitting,
      iconPath: resolveRuntimeIconPath(),
      onClosed: () => this.clearFocusWidgetWindow(window),
    });

    this.focusWidgetWindow = window;
    return window;
  }

  resizeFocusWidget(width: number, height: number): void {
    const window = this.getFocusWidgetWindow();

    if (!window) {
      return;
    }

    const [x, y] = window.getPosition();
    if (x === undefined || y === undefined) {
      return;
    }

    window.setBounds(clampFocusWidgetBounds({ height, width, x, y }));
  }

  showMainWindow(): void {
    const window = this.ensureMainWindow();

    if (window.isMinimized()) {
      window.restore();
    }

    window.show();
    window.focus();
  }

  showFocusWidget(): void {
    const window = this.ensureFocusWidgetWindow();

    positionFocusWidgetWindow(window);
    window.showInactive();
  }

  showWindDown(): void {
    const window = this.ensureMainWindow();

    if (window.isMinimized()) {
      window.restore();
    }

    window.show();
    window.focus();

    if (window.webContents.isLoading()) {
      window.webContents.once("did-finish-load", () => {
        this.broadcastWindDownNavigationRequested();
      });
      return;
    }

    this.broadcastWindDownNavigationRequested();
  }

  broadcastUpdateState(state: AppUpdateState): void {
    for (const window of this.options.getAllWindows()) {
      window.webContents.send(APP_UPDATER_CHANNELS.stateChanged, state);
    }
  }

  broadcastFocusSessionRecorded(focusSession: FocusSession): void {
    for (const window of this.options.getAllWindows()) {
      window.webContents.send(
        HABITS_IPC_CHANNELS.focusSessionRecorded,
        focusSession
      );
    }
  }

  broadcastFocusTimerStateChanged(state: PersistedFocusTimerState): void {
    for (const window of this.options.getAllWindows()) {
      window.webContents.send(
        HABITS_IPC_CHANNELS.focusTimerStateChanged,
        state
      );
    }
  }

  broadcastFocusTimerShortcutStatus(status: FocusTimerShortcutStatus): void {
    for (const window of this.options.getAllWindows()) {
      window.webContents.send(
        HABITS_IPC_CHANNELS.focusTimerShortcutStatusChanged,
        status
      );
    }
  }

  dispatchFocusTimerAction(request: FocusTimerActionRequest): void {
    const targetWindow = this.getPreferredFocusTimerWindow();

    if (!targetWindow) {
      return;
    }

    targetWindow.webContents.send(
      HABITS_IPC_CHANNELS.focusTimerActionRequested,
      request
    );
  }

  private clearMainWindow(window: BrowserWindowType): void {
    if (this.mainWindow === window) {
      this.mainWindow = null;
    }
  }

  private clearFocusWidgetWindow(window: BrowserWindowType): void {
    if (this.focusWidgetWindow === window) {
      this.focusWidgetWindow = null;
    }
  }

  private getMainWindow(): BrowserWindowType | null {
    return this.mainWindow && !this.mainWindow.isDestroyed()
      ? this.mainWindow
      : null;
  }

  private getFocusWidgetWindow(): BrowserWindowType | null {
    return this.focusWidgetWindow && !this.focusWidgetWindow.isDestroyed()
      ? this.focusWidgetWindow
      : null;
  }

  private broadcastWindDownNavigationRequested(): void {
    for (const window of this.options.getAllWindows()) {
      window.webContents.send(HABITS_IPC_CHANNELS.windDownNavigationRequested);
    }
  }

  private getPreferredFocusTimerWindow(): BrowserWindowType | null {
    const focusedWindow = BrowserWindow.getFocusedWindow();

    if (focusedWindow && !focusedWindow.isDestroyed()) {
      return focusedWindow;
    }

    return this.getMainWindow() ?? this.getFocusWidgetWindow();
  }
}
