export interface WindDownRuntimeState {
  lastReminderSentAt: string | null;
}

export const DEFAULT_WIND_DOWN_RUNTIME_STATE: WindDownRuntimeState = {
  lastReminderSentAt: null,
};
