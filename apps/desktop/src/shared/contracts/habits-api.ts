import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";

import type { HabitCommand, ResultForCommand } from "./habits-ipc-commands";
import type { HabitQuery, ResultForQuery } from "./habits-ipc-queries";

export type FocusTimerAction = "reset" | "toggle";
export type FocusTimerActionSource =
  | "global-shortcut"
  | "main-window"
  | "widget";

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

export type DesktopNotificationAvailability =
  | "available"
  | "blocked"
  | "unsupported"
  | "unknown";

export type DesktopNotificationReason =
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

export interface HabitsApi {
  command: <C extends HabitCommand>(command: C) => Promise<ResultForCommand<C>>;
  clearData: () => Promise<boolean>;
  claimFocusTimerCycleCompletion: (cycleId: string) => Promise<boolean>;
  claimFocusTimerLeadership: (
    instanceId: string,
    ttlMs: number
  ) => Promise<boolean>;
  exportBackup: () => Promise<string | null>;
  getDesktopNotificationStatus: () => Promise<DesktopNotificationStatus>;
  getFocusTimerShortcutStatus: () => Promise<FocusTimerShortcutStatus>;
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
  query: <Q extends HabitQuery>(query: Q) => Promise<ResultForQuery<Q>>;
  releaseFocusTimerLeadership: (instanceId: string) => Promise<void>;
  resizeFocusWidget: (width: number, height: number) => Promise<void>;
  showFocusWidget: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  showNotification: (
    title: string,
    body: string,
    iconFilename?: string
  ) => Promise<void>;
}
