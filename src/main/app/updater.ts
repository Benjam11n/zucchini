import { APP_UPDATER_CHANNELS } from "@/shared/contracts/app-updater";
import type {
  AppUpdateState,
  SerializedAppUpdaterIpcError,
} from "@/shared/contracts/app-updater";

const UPDATE_CHECK_DELAY_MS = 15_000;
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const SAFE_UPDATE_ERROR_MESSAGE =
  "Zucchini could not complete the update action.";

export type AppUpdateSupportMode = "development" | "disabled" | "production";

type AppUpdaterEventName =
  | "checking-for-update"
  | "download-progress"
  | "error"
  | "update-available"
  | "update-downloaded"
  | "update-not-available";

interface ProgressInfo {
  percent: number;
}

interface UpdateInfo {
  version: string;
}

interface LoggerLike {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;
type ScheduleFn = (handler: () => void, delayMs: number) => TimerHandle;
type MaybePromise<T> = Promise<T> | T;

type IpcHandlerResult = AppUpdateState | undefined;

export interface AutoUpdaterLike {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  forceDevUpdateConfig?: boolean;
  logger?: LoggerLike | null;
  checkForUpdates: () => Promise<unknown>;
  downloadUpdate: () => Promise<unknown>;
  on: (
    event: AppUpdaterEventName,
    listener: (...args: unknown[]) => void
  ) => void;
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void;
}

interface RegisterAppUpdaterOptions {
  broadcastState: (state: AppUpdateState) => void;
  currentVersion: string;
  handleIpc: (
    channel: string,
    handler: () => MaybePromise<IpcHandlerResult>
  ) => void;
  log: LoggerLike;
  scheduleInterval: ScheduleFn;
  scheduleTimeout: ScheduleFn;
  supportMode: AppUpdateSupportMode;
  updater: AutoUpdaterLike;
}

export interface AppUpdaterController {
  getState: () => AppUpdateState;
  start: () => void;
}

function noopStart(): void {
  // Updates are intentionally disabled in unsupported environments.
}

function createInitialState(
  currentVersion: string,
  supportMode: AppUpdateSupportMode
): AppUpdateState {
  return {
    availableVersion: null,
    currentVersion,
    errorMessage: null,
    progressPercent: null,
    status: supportMode === "disabled" ? "unavailable" : "idle",
  };
}

function toRoundedProgress(percent: number): number {
  return Math.min(100, Math.max(0, Math.round(percent)));
}

function toErrorMessage(): string {
  return SAFE_UPDATE_ERROR_MESSAGE;
}

function toDownloadedErrorState(state: AppUpdateState): AppUpdateState {
  return {
    ...state,
    errorMessage: toErrorMessage(),
    progressPercent: 100,
    status: "downloaded",
  };
}

export function resolveAppUpdateSupportMode({
  appIsPackaged,
  hasDevConfigFile,
  hasConfigFile,
  platform,
}: {
  appIsPackaged: boolean;
  hasDevConfigFile: boolean;
  hasConfigFile: boolean;
  platform: NodeJS.Platform;
}): AppUpdateSupportMode {
  if (platform !== "darwin" && platform !== "win32") {
    return "disabled";
  }

  if (appIsPackaged && hasConfigFile) {
    return "production";
  }

  if (!appIsPackaged && hasDevConfigFile) {
    return "development";
  }

  return "disabled";
}

export function serializeAppUpdaterIpcError(): SerializedAppUpdaterIpcError {
  return {
    code: "UPDATE_ERROR",
    message: SAFE_UPDATE_ERROR_MESSAGE,
  };
}

export function registerAppUpdater({
  broadcastState,
  currentVersion,
  handleIpc,
  log,
  scheduleInterval,
  scheduleTimeout,
  supportMode,
  updater,
}: RegisterAppUpdaterOptions): AppUpdaterController {
  const supportsAutoUpdates = supportMode !== "disabled";
  let isCheckingForUpdates = false;
  let state = createInitialState(currentVersion, supportMode);

  function setState(nextState: AppUpdateState): void {
    state = nextState;
    broadcastState(state);
  }

  async function checkForUpdates(): Promise<void> {
    if (
      !supportsAutoUpdates ||
      isCheckingForUpdates ||
      state.status === "available" ||
      state.status === "checking" ||
      state.status === "downloaded" ||
      state.status === "downloading" ||
      state.status === "error"
    ) {
      return;
    }

    isCheckingForUpdates = true;
    try {
      await updater.checkForUpdates();
    } catch (error) {
      log.error("Failed to check for updates.", error);

      if (state.availableVersion === null) {
        setState({
          ...state,
          errorMessage: null,
          progressPercent: null,
          status: "idle",
        });
      } else {
        setState({
          ...state,
          errorMessage: toErrorMessage(),
          progressPercent: null,
          status: "error",
        });
      }
    } finally {
      isCheckingForUpdates = false;
    }
  }

  handleIpc(APP_UPDATER_CHANNELS.getState, () => state);
  handleIpc(
    APP_UPDATER_CHANNELS.checkForUpdates,
    async (): Promise<IpcHandlerResult> => {
      if (
        !supportsAutoUpdates ||
        state.status === "available" ||
        state.status === "downloaded" ||
        state.status === "downloading"
      ) {
        return;
      }

      await checkForUpdates();
    }
  );
  handleIpc(
    APP_UPDATER_CHANNELS.downloadUpdate,
    async (): Promise<IpcHandlerResult> => {
      if (
        !supportsAutoUpdates ||
        (state.status !== "available" && state.status !== "error")
      ) {
        return;
      }

      await updater.downloadUpdate();
    }
  );
  handleIpc(APP_UPDATER_CHANNELS.installUpdate, (): IpcHandlerResult => {
    if (!supportsAutoUpdates || state.status !== "downloaded") {
      return;
    }

    try {
      updater.quitAndInstall(false, true);
    } catch (error) {
      log.error("Failed to install the downloaded update.", error);
      setState(toDownloadedErrorState(state));
      throw error;
    }
  });

  if (!supportsAutoUpdates) {
    return {
      getState: () => state,
      start: noopStart,
    };
  }

  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  updater.forceDevUpdateConfig = supportMode === "development";
  updater.logger = log;

  updater.on("checking-for-update", () => {
    setState({
      ...state,
      errorMessage: null,
      progressPercent: null,
      status: "checking",
    });
  });
  updater.on("update-available", (info) => {
    const nextInfo = info as UpdateInfo;

    setState({
      availableVersion: nextInfo.version,
      currentVersion,
      errorMessage: null,
      progressPercent: null,
      status: "available",
    });
  });
  updater.on("download-progress", (progress) => {
    const nextProgress = progress as ProgressInfo;

    setState({
      ...state,
      errorMessage: null,
      progressPercent: toRoundedProgress(nextProgress.percent),
      status: "downloading",
    });
  });
  updater.on("update-downloaded", (info) => {
    const nextInfo = info as UpdateInfo;

    setState({
      availableVersion: nextInfo.version,
      currentVersion,
      errorMessage: null,
      progressPercent: 100,
      status: "downloaded",
    });
  });
  updater.on("update-not-available", () => {
    setState({
      availableVersion: null,
      currentVersion,
      errorMessage: null,
      progressPercent: null,
      status: "idle",
    });
  });
  updater.on("error", (error) => {
    log.error("Auto-updater emitted an error.", error);

    if (state.availableVersion === null) {
      setState({
        ...state,
        errorMessage: null,
        progressPercent: null,
        status: "idle",
      });
      return;
    }

    if (state.status === "downloaded") {
      setState(toDownloadedErrorState(state));
      return;
    }

    setState({
      ...state,
      errorMessage: toErrorMessage(),
      progressPercent: null,
      status: "error",
    });
  });

  return {
    getState: () => state,
    start: () => {
      scheduleTimeout(() => {
        checkForUpdates();
      }, UPDATE_CHECK_DELAY_MS);
      scheduleInterval(() => {
        checkForUpdates();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  };
}
