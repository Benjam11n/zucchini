import {
  IpcValidationError,
  validateAppSettings,
  validateCompleteOnboardingInput,
  validateNotificationIconFilename,
  validateReorderHabitIds,
  validateStarterPackApply,
} from "./ipc-validation";

describe("ipc validation", () => {
  it("accepts valid app settings payloads", () => {
    expect(
      validateAppSettings({
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
});
