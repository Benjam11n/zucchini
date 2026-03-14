import {
  IpcValidationError,
  validateAppSettings,
  validateCreateFocusSessionInput,
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
        focusDefaultDurationSeconds: 1500,
        focusLongBreakSeconds: 15 * 60,
        focusShortBreakSeconds: 5 * 60,
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
        focusDefaultDurationSeconds: 1500,
        focusLongBreakSeconds: 15 * 60,
        focusShortBreakSeconds: 5 * 60,
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

  it("rejects focus durations longer than 60 minutes", () => {
    expect(() =>
      validateAppSettings({
        focusCyclesBeforeLongBreak: 4,
        focusDefaultDurationSeconds: 3601,
        focusLongBreakSeconds: 15 * 60,
        focusShortBreakSeconds: 5 * 60,
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

  it("rejects long breaks shorter than short breaks", () => {
    expect(() =>
      validateAppSettings({
        focusCyclesBeforeLongBreak: 4,
        focusDefaultDurationSeconds: 1500,
        focusLongBreakSeconds: 4 * 60,
        focusShortBreakSeconds: 5 * 60,
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

  it("rejects invalid starter pack payloads", () => {
    expect(() =>
      validateStarterPackApply([
        {
          category: "productivity",
          frequency: "daily",
          name: "",
        },
      ])
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
        entryKind: "completed",
        startedAt: "2026-03-08T09:00:00.000Z",
        timerSessionId: "timer-session-1",
      })
    ).toMatchObject({
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      timerSessionId: "timer-session-1",
    });
  });

  it("rejects invalid focus session limits", () => {
    expect(() => validateFocusSessionLimit(0)).toThrow(IpcValidationError);
  });
});
