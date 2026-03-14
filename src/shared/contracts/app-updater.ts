export const APP_UPDATER_CHANNELS = {
  checkForUpdates: "app-updater:check",
  downloadUpdate: "app-updater:download",
  getState: "app-updater:getState",
  installUpdate: "app-updater:install",
  stateChanged: "app-updater:stateChanged",
} as const;

export type AppUpdaterIpcErrorCode = "UPDATE_ERROR";

export interface SerializedAppUpdaterIpcError {
  code: AppUpdaterIpcErrorCode;
  message: string;
}

export type AppUpdaterIpcResponse<T> =
  | { data: T; ok: true }
  | { error: SerializedAppUpdaterIpcError; ok: false };

export class AppUpdaterIpcError extends Error {
  readonly code: AppUpdaterIpcErrorCode;

  constructor({ code, message }: SerializedAppUpdaterIpcError) {
    super(message);
    this.code = code;
    this.name = "AppUpdaterIpcError";
  }
}

export type AppUpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error"
  | "unavailable";

export interface AppUpdateState {
  availableVersion: string | null;
  currentVersion: string;
  errorMessage: string | null;
  progressPercent: number | null;
  status: AppUpdateStatus;
}

export interface AppUpdaterApi {
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  getState: () => Promise<AppUpdateState>;
  installUpdate: () => Promise<void>;
  onStateChange: (listener: (state: AppUpdateState) => void) => () => void;
}
