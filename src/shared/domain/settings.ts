export type ThemeMode = "system" | "light" | "dark";

export const DEFAULT_REMINDER_TIME = "20:30";
export const DEFAULT_REMINDER_SNOOZE_MINUTES = 15;

export interface AppSettings {
  launchAtLogin: boolean;
  minimizeToTray: boolean;
  reminderEnabled: boolean;
  reminderSnoozeMinutes: number;
  reminderTime: string;
  themeMode: ThemeMode;
  timezone: string;
}
