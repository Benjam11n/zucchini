import type { ZodIssue } from "zod";

import {
  areAppSettingsEqual,
  mapSettingsValidationErrors,
} from "@/renderer/features/settings/lib/settings-form";
import type { AppSettings } from "@/shared/domain/settings";

const baseSettings: AppSettings = {
  focusCyclesBeforeLongBreak: 4,
  focusDefaultDurationSeconds: 1500,
  focusLongBreakMinutes: 15,
  focusShortBreakMinutes: 5,
  launchAtLogin: false,
  minimizeToTray: false,
  reminderEnabled: true,
  reminderSnoozeMinutes: 15,
  reminderTime: "20:30",
  themeMode: "system",
  timezone: "Asia/Singapore",
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
    ] as ZodIssue[];

    expect(mapSettingsValidationErrors(issues)).toStrictEqual({
      timezone: "First",
    });
  });
});
