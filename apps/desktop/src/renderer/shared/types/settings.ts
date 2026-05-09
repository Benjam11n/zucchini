import type { AppSettings } from "@/shared/domain/settings";

export type SettingsSavePhase =
  | "idle"
  | "pending"
  | "invalid"
  | "saving"
  | "saved"
  | "error";

export type SettingsFieldErrors = Partial<Record<keyof AppSettings, string>>;
