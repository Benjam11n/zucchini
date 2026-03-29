import type {
  AppSettings,
  PomodoroTimerSettings,
} from "@/shared/domain/settings";
import {
  createDefaultAppSettings,
  createDefaultPomodoroTimerSettings,
} from "@/shared/domain/settings";

export function minutes(value: number): number {
  return value * 60;
}

export function minutesMs(value: number): number {
  return minutes(value) * 1000;
}

export function createTestPomodoroSettings(
  overrides: Partial<PomodoroTimerSettings> = {}
): PomodoroTimerSettings {
  return {
    ...createDefaultPomodoroTimerSettings(),
    ...overrides,
  };
}

export function createTestAppSettings(
  overrides: Partial<AppSettings> = {}
): AppSettings {
  return {
    ...createDefaultAppSettings("Asia/Singapore"),
    ...overrides,
  };
}
