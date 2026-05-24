import type {
  HabitCommand,
  ResultForCommand,
} from "@/shared/contracts/ipc/habits-command-registry";
import type {
  HabitQuery,
  ResultForQuery,
} from "@/shared/contracts/ipc/habits-query-registry";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";

export type FocusTimerAction = "reset" | "toggle";
type FocusTimerActionSource = "global-shortcut" | "main-window" | "widget";

export interface FocusTimerActionRequest {
  action: FocusTimerAction;
  source: FocusTimerActionSource;
}

export interface FocusTimerShortcutRegistration {
  activeAccelerator: string | null;
  accelerator: string;
  errorMessage: string | null;
  isRegistered: boolean;
}

export interface FocusTimerShortcutStatus {
  reset: FocusTimerShortcutRegistration;
  toggle: FocusTimerShortcutRegistration;
}

type DesktopNotificationAvailability =
  | "available"
  | "blocked"
  | "unsupported"
  | "unknown";

type DesktopNotificationReason =
  | "app-busy"
  | "do-not-disturb"
  | "full-screen-app"
  | "other-app-active"
  | "platform-error"
  | "presentation-mode"
  | "quiet-time"
  | "session-locked"
  | "unsupported-platform"
  | null;

export interface DesktopNotificationStatus {
  availability: DesktopNotificationAvailability;
  reason: DesktopNotificationReason;
}

export interface BackupRestorePreview {
  completedHabitCount: number;
  fileName: string;
  filePath: string;
  focusSessionCount: number;
  habitCount: number;
  habitPreviewTotalCount: number;
  habits: BackupRestoreHabitPreview[];
  latestActivityDate: string | null;
  modifiedAt: string;
  restoreId: string;
  sizeBytes: number;
  source: "auto" | "file";
}

interface BackupRestoreHabitPreview {
  category: string;
  frequency: string;
  id: number;
  name: string;
  pausedAt: string | null;
  selectedWeekdays: number[] | null;
  sortOrder: number;
  targetCount: number;
}

export interface HabitsApi {
  chooseBackupForRestore: () => Promise<BackupRestorePreview | null>;
  command: <C extends HabitCommand>(command: C) => Promise<ResultForCommand<C>>;
  clearData: () => Promise<boolean>;
  claimFocusTimerCycleCompletion: (cycleId: string) => Promise<boolean>;
  claimFocusTimerLeadership: (
    instanceId: string,
    ttlMs: number
  ) => Promise<boolean>;
  exportBackup: () => Promise<string | null>;
  exportCsvData: () => Promise<string | null>;
  getDesktopNotificationStatus: () => Promise<DesktopNotificationStatus>;
  getFocusTimerShortcutStatus: () => Promise<FocusTimerShortcutStatus>;
  getLatestAutoBackupRestorePreview: () => Promise<BackupRestorePreview | null>;
  importBackup: () => Promise<boolean>;
  onFocusTimerActionRequested: (
    listener: (request: FocusTimerActionRequest) => void
  ) => () => void;
  onFocusTimerShortcutStatusChanged: (
    listener: (status: FocusTimerShortcutStatus) => void
  ) => () => void;
  onWindDownNavigationRequested: (listener: () => void) => () => void;
  onFocusSessionRecorded: (
    listener: (session: FocusSession) => void
  ) => () => void;
  onFocusTimerStateChanged: (
    listener: (state: PersistedFocusTimerState) => void
  ) => () => void;
  openDataFolder: () => Promise<string>;
  openAutoBackupFolder: () => Promise<string>;
  query: <Q extends HabitQuery>(query: Q) => Promise<ResultForQuery<Q>>;
  releaseFocusTimerLeadership: (instanceId: string) => Promise<void>;
  restoreBackup: (restoreId: string) => Promise<boolean>;
  resizeFocusWidget: (width: number, height: number) => Promise<void>;
  showFocusWidget: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  showNotification: (
    title: string,
    body: string,
    iconFilename?: string
  ) => Promise<void>;
}
