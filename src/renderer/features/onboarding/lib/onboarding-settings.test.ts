import {
  createReminderDraft,
  resolveOnboardingSettings,
} from "./onboarding-settings";

describe("onboarding settings", () => {
  const baseSettings = {
    focusCyclesBeforeLongBreak: 4,
    focusLongBreakMinutes: 15,
    focusShortBreakMinutes: 5,
    launchAtLogin: false,
    minimizeToTray: false,
    reminderEnabled: true,
    reminderSnoozeMinutes: 15,
    reminderTime: "20:30",
    themeMode: "system" as const,
    timezone: "Asia/Singapore",
  };

  it("builds a reminder draft from app settings", () => {
    expect(createReminderDraft(baseSettings)).toStrictEqual({
      reminderEnabled: true,
      reminderTime: "20:30",
      timezone: "Asia/Singapore",
    });
  });

  it("validates onboarding reminder settings", () => {
    expect(
      resolveOnboardingSettings(baseSettings, {
        reminderEnabled: true,
        reminderTime: "21:15",
        timezone: "America/New_York",
      })
    ).toStrictEqual({
      fieldErrors: {},
      settings: {
        ...baseSettings,
        reminderTime: "21:15",
        timezone: "America/New_York",
      },
    });

    expect(
      resolveOnboardingSettings(baseSettings, {
        reminderEnabled: true,
        reminderTime: "99:00",
        timezone: "Asia/Singapore",
      }).fieldErrors
    ).toStrictEqual({
      reminderTime: "Reminder time must use HH:MM 24-hour format.",
    });
  });
});
