import {
  registerAppUpdater,
  resolveAppUpdateSupportMode,
} from "@/main/app/updater";
import { APP_UPDATER_CHANNELS } from "@/shared/contracts/app-updater";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

interface AppUpdaterEventMap {
  "checking-for-update": [];
  "download-progress": [{ percent: number }];
  error: [Error];
  "update-available": [{ version: string }];
  "update-downloaded": [{ version: string }];
  "update-not-available": [];
}

class FakeAutoUpdater {
  autoDownload = true;
  autoInstallOnAppQuit = true;
  forceDevUpdateConfig = false;
  logger:
    | {
        error: (...args: unknown[]) => void;
        info: (...args: unknown[]) => void;
        warn: (...args: unknown[]) => void;
      }
    | undefined;
  downloadUpdate = vi.fn(async () => {});
  checkForUpdates = vi.fn(async () => {});
  quitAndInstall = vi.fn();

  private readonly listeners = new Map<
    keyof AppUpdaterEventMap,
    ((...args: AppUpdaterEventMap[keyof AppUpdaterEventMap]) => void)[]
  >();

  on<TEvent extends keyof AppUpdaterEventMap>(
    event: TEvent,
    listener: (...args: AppUpdaterEventMap[TEvent]) => void
  ): void {
    const nextListeners = this.listeners.get(event) ?? [];
    nextListeners.push(
      listener as (
        ...args: AppUpdaterEventMap[keyof AppUpdaterEventMap]
      ) => void
    );
    this.listeners.set(event, nextListeners);
  }

  emit<TEvent extends keyof AppUpdaterEventMap>(
    event: TEvent,
    ...args: AppUpdaterEventMap[TEvent]
  ): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

describe("registerAppUpdater()", () => {
  function createController({
    supportsAutoUpdates = true,
  }: {
    supportsAutoUpdates?: boolean;
  } = {}) {
    const updater = new FakeAutoUpdater();
    const handlers = new Map<
      string,
      () => AppUpdateState | undefined | Promise<AppUpdateState | undefined>
    >();
    const broadcastState = vi.fn<(state: AppUpdateState) => void>();
    const scheduleInterval = vi.fn();
    const scheduleTimeout = vi.fn();
    const log = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };

    const controller = registerAppUpdater({
      broadcastState,
      currentVersion: "0.1.0",
      handleIpc: (channel, handler) => {
        handlers.set(channel, handler);
      },
      log,
      scheduleInterval,
      scheduleTimeout,
      supportMode: supportsAutoUpdates ? "production" : "disabled",
      updater,
    });

    return {
      broadcastState,
      controller,
      handlers,
      log,
      scheduleInterval,
      scheduleTimeout,
      updater,
    };
  }

  it("registers manual download and install handlers", async () => {
    const { handlers, updater } = createController();

    updater.emit("update-available", {
      version: "0.2.0",
    });

    await handlers.get(APP_UPDATER_CHANNELS.downloadUpdate)?.();

    expect(updater.downloadUpdate.mock.calls).toHaveLength(1);

    updater.emit("update-downloaded", {
      version: "0.2.0",
    });

    await handlers.get(APP_UPDATER_CHANNELS.installUpdate)?.();

    expect(updater.quitAndInstall.mock.calls).toHaveLength(1);
    expect(updater.quitAndInstall).toHaveBeenCalledWith(false, true);
  });

  it("keeps the restart state when install invocation fails", () => {
    const { broadcastState, handlers, updater } = createController();

    updater.emit("update-downloaded", {
      version: "0.2.0",
    });
    updater.quitAndInstall.mockImplementation(() => {
      throw new Error("install failed");
    });

    expect(() => {
      handlers.get(APP_UPDATER_CHANNELS.installUpdate)?.();
    }).toThrow("install failed");

    expect(broadcastState).toHaveBeenLastCalledWith({
      availableVersion: "0.2.0",
      currentVersion: "0.1.0",
      errorMessage: "Zucchini could not complete the update action.",
      progressPercent: 100,
      status: "downloaded",
    });
  });

  it("registers a manual check handler when updates are supported", async () => {
    const { handlers, updater } = createController();

    await handlers.get(APP_UPDATER_CHANNELS.checkForUpdates)?.();

    expect(updater.checkForUpdates.mock.calls).toHaveLength(1);
  });

  it("broadcasts state changes from updater events", () => {
    const { broadcastState, updater } = createController();

    updater.emit("update-available", {
      version: "0.2.0",
    });
    updater.emit("download-progress", {
      percent: 48.6,
    });

    expect(broadcastState).toHaveBeenLastCalledWith({
      availableVersion: "0.2.0",
      currentVersion: "0.1.0",
      errorMessage: null,
      progressPercent: 49,
      status: "downloading",
    });
  });

  it("keeps update errors visible after a version is found", () => {
    const { broadcastState, updater } = createController();

    updater.emit("update-available", {
      version: "0.2.0",
    });
    updater.emit("error", new Error("network down"));

    expect(broadcastState).toHaveBeenLastCalledWith({
      availableVersion: "0.2.0",
      currentVersion: "0.1.0",
      errorMessage: "Zucchini could not complete the update action.",
      progressPercent: null,
      status: "error",
    });
  });

  it("keeps downloaded updates restartable after updater errors", () => {
    const { broadcastState, updater } = createController();

    updater.emit("update-downloaded", {
      version: "0.2.0",
    });
    updater.emit("error", new Error("install failed"));

    expect(broadcastState).toHaveBeenLastCalledWith({
      availableVersion: "0.2.0",
      currentVersion: "0.1.0",
      errorMessage: "Zucchini could not complete the update action.",
      progressPercent: 100,
      status: "downloaded",
    });
  });

  it("stays unavailable when auto-updates are disabled", async () => {
    const { controller, handlers, scheduleInterval, scheduleTimeout, updater } =
      createController({
        supportsAutoUpdates: false,
      });

    controller.start();

    expect(controller.getState()).toStrictEqual({
      availableVersion: null,
      currentVersion: "0.1.0",
      errorMessage: null,
      progressPercent: null,
      status: "unavailable",
    });
    expect(scheduleTimeout).not.toHaveBeenCalled();
    expect(scheduleInterval).not.toHaveBeenCalled();

    await handlers.get(APP_UPDATER_CHANNELS.downloadUpdate)?.();

    expect(updater.downloadUpdate).not.toHaveBeenCalled();
  });

  it("schedules startup and periodic update checks", () => {
    const { controller, scheduleInterval, scheduleTimeout } =
      createController();

    controller.start();

    expect(scheduleTimeout.mock.calls).toHaveLength(1);
    expect(scheduleInterval.mock.calls).toHaveLength(1);
  });

  it("enables the documented dev updater flow when dev-app-update.yml exists", () => {
    const updater = new FakeAutoUpdater();

    registerAppUpdater({
      broadcastState: vi.fn(),
      currentVersion: "0.1.0",
      handleIpc: vi.fn(),
      log: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
      scheduleInterval: vi.fn(),
      scheduleTimeout: vi.fn(),
      supportMode: "development",
      updater,
    });

    expect(updater.forceDevUpdateConfig).toBeTruthy();
  });
});

describe("resolveAppUpdateSupportMode()", () => {
  it("returns development when an unpackaged app has dev-app-update.yml", () => {
    expect(
      resolveAppUpdateSupportMode({
        appIsPackaged: false,
        hasConfigFile: false,
        hasDevConfigFile: true,
        platform: "darwin",
      })
    ).toBe("development");
  });
});
