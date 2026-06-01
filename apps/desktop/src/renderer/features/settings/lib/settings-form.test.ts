import {
  areAppSettingsEqual,
  mapSettingsValidationErrors,
  validateAppSettings,
} from "@/renderer/features/settings/lib/settings-form";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

const baseSettings: AppSettings = {
  ...createDefaultAppSettings("Asia/Singapore"),
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

describe("areAppSettingsEqual()", () => {
  it("returns true when every settings field matches", () => {
    expect(
      areAppSettingsEqual(baseSettings, {
        ...baseSettings,
      })
    ).toBeTruthy();
  });

  it("returns false when any settings field differs", () => {
    expect(
      areAppSettingsEqual(baseSettings, {
        ...baseSettings,
        reminderSnoozeMinutes: 30,
      })
    ).toBeFalsy();
  });

  it("returns false when only auto backup cadence differs", () => {
    expect(
      areAppSettingsEqual(baseSettings, {
        ...baseSettings,
        autoBackupCadence: "daily",
      })
    ).toBeFalsy();
  });

  it("returns false when only one side is present", () => {
    expect(areAppSettingsEqual(baseSettings, null)).toBeFalsy();
  });
});

describe("mapSettingsValidationErrors()", () => {
  it("maps the first issue for each settings field", () => {
    const issues = [
      {
        code: "custom",
        message: "Reminder snooze minutes must be between 1 and 240.",
        path: ["reminderSnoozeMinutes"],
      },
      {
        code: "custom",
        message: "Reminder time must use HH:MM 24-hour format.",
        path: ["reminderTime"],
      },
    ] as {
      code: "custom";
      message: string;
      path: string[];
    }[];

    expect(mapSettingsValidationErrors(issues)).toStrictEqual({
      reminderSnoozeMinutes:
        "Reminder snooze minutes must be between 1 and 240.",
      reminderTime: "Reminder time must use HH:MM 24-hour format.",
    });
  });

  it("ignores duplicate issues for the same field", () => {
    const issues = [
      {
        code: "custom",
        message: "First",
        path: ["timezone"],
      },
      {
        code: "custom",
        message: "Second",
        path: ["timezone"],
      },
    ];

    expect(mapSettingsValidationErrors(issues)).toStrictEqual({
      timezone: "First",
    });
  });
});

describe("validateAppSettings()", () => {
  it("returns success for valid settings", () => {
    expect(validateAppSettings(baseSettings).success).toBeTruthy();
  });

  it("returns field issues for invalid settings", () => {
    const result = validateAppSettings({
      ...baseSettings,
      focusLongBreakSeconds: 60,
      focusShortBreakSeconds: 120,
      reminderTime: "25:99",
    });

    expect(result.success).toBeFalsy();
    expect(mapSettingsValidationErrors(result.issues)).toStrictEqual({
      focusLongBreakSeconds:
        "Long break duration must be greater than or equal to short break duration.",
      reminderTime: "Reminder time must use HH:MM 24-hour format.",
    });
  });
});
