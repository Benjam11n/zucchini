import {
  IpcValidationError,
  validateAppSettings,
  validateCreateFocusSessionInput,
  validateCompleteOnboardingInput,
  validateFocusSessionLimit,
  validateNotificationIconFilename,
  validateReorderHabitIds,
  validateStarterPackApply,
} from "./validation";

describe("ipc validation", () => {
  it("accepts valid app settings payloads", () => {
    expect(
      validateAppSettings({
        focusCyclesBeforeLongBreak: 4,
        focusLongBreakMinutes: 15,
        focusShortBreakMinutes: 5,
        launchAtLogin: false,
        minimizeToTray: true,
        reminderEnabled: true,
        reminderSnoozeMinutes: 15,
        reminderTime: "20:30",
        themeMode: "system",
        timezone: "Asia/Singapore",
      })
    ).toMatchObject({
      minimizeToTray: true,
      reminderSnoozeMinutes: 15,
      timezone: "Asia/Singapore",
    });
  });

  it("rejects invalid timezones with a typed ipc validation error", () => {
    expect(() =>
      validateAppSettings({
        focusCyclesBeforeLongBreak: 4,
        focusLongBreakMinutes: 15,
        focusShortBreakMinutes: 5,
        launchAtLogin: false,
        minimizeToTray: false,
        reminderEnabled: true,
        reminderSnoozeMinutes: 15,
        reminderTime: "20:30",
        themeMode: "system",
        timezone: "Mars/Colony",
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects long breaks shorter than short breaks", () => {
    expect(() =>
      validateAppSettings({
        focusCyclesBeforeLongBreak: 4,
        focusLongBreakMinutes: 4,
        focusShortBreakMinutes: 5,
        launchAtLogin: false,
        minimizeToTray: false,
        reminderEnabled: true,
        reminderSnoozeMinutes: 15,
        reminderTime: "20:30",
        themeMode: "system",
        timezone: "Asia/Singapore",
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects duplicate habit ids in reorder payloads", () => {
    expect(() => validateReorderHabitIds([1, 1, 2])).toThrow(
      IpcValidationError
    );
  });

  it("accepts valid starter pack payloads", () => {
    expect(
      validateStarterPackApply([
        {
          category: "productivity",
          frequency: "daily",
          name: "Plan top 3 tasks",
        },
      ])
    ).toStrictEqual([
      {
        category: "productivity",
        frequency: "daily",
        name: "Plan top 3 tasks",
      },
    ]);
  });

  it("rejects invalid onboarding payloads", () => {
    expect(() =>
      validateCompleteOnboardingInput({
        habits: [
          {
            category: "productivity",
            frequency: "daily",
            name: "",
          },
        ],
        settings: {
          focusCyclesBeforeLongBreak: 4,
          focusLongBreakMinutes: 15,
          focusShortBreakMinutes: 5,
          launchAtLogin: false,
          minimizeToTray: false,
          reminderEnabled: true,
          reminderSnoozeMinutes: 15,
          reminderTime: "20:30",
          themeMode: "system",
          timezone: "Asia/Singapore",
        },
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects unsafe notification icon filenames", () => {
    expect(() => validateNotificationIconFilename("../secrets.png")).toThrow(
      IpcValidationError
    );
  });

  it("accepts valid focus session payloads", () => {
    expect(
      validateCreateFocusSessionInput({
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        startedAt: "2026-03-08T09:00:00.000Z",
      })
    ).toMatchObject({
      completedDate: "2026-03-08",
      durationSeconds: 1500,
    });
  });

  it("rejects invalid focus session limits", () => {
    expect(() => validateFocusSessionLimit(0)).toThrow(IpcValidationError);
  });
});
