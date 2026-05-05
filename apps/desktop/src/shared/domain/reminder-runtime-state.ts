export interface ReminderRuntimeState {
  lastMidnightWarningSentAt: string | null;
  lastMissedReminderSentAt: string | null;
  lastReminderSentAt: string | null;
  snoozedUntil: string | null;
}

export const DEFAULT_REMINDER_RUNTIME_STATE: ReminderRuntimeState = {
  lastMidnightWarningSentAt: null,
  lastMissedReminderSentAt: null,
  lastReminderSentAt: null,
  snoozedUntil: null,
};
