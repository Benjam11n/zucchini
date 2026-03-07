export type ThemeMode = "system" | "light" | "dark";

export interface AppSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  themeMode: ThemeMode;
  timezone: string;
}
