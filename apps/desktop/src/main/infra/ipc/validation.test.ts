import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import {
  IpcValidationError,
  validateAppSettings,
  validateCreateFocusSessionInput,
  validateFocusSessionLimit,
  validateHabitCategory,
  validateHabitFrequency,
  validateHabitId,
  validateHabitName,
  validateHabitQuery,
  validateHabitTargetCount,
  validateHabitWeekdays,
  validateNotificationIconFilename,
  validateReorderHabitIds,
} from "./validation";

describe("ipc validation", () => {
  it("accepts valid app settings payloads", () => {
    expect(
      validateAppSettings({
        ...createDefaultAppSettings("Asia/Singapore"),
        minimizeToTray: true,
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
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
        ...createDefaultAppSettings("Asia/Singapore"),
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        timezone: "Mars/Colony",
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects focus durations longer than 60 minutes", () => {
    expect(() =>
      validateAppSettings({
        ...createDefaultAppSettings("Asia/Singapore"),
        focusDefaultDurationSeconds: 3601,
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects long breaks shorter than short breaks", () => {
    expect(() =>
      validateAppSettings({
        ...createDefaultAppSettings("Asia/Singapore"),
        focusLongBreakSeconds: 4 * 60,
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects duplicate global focus timer shortcuts", () => {
    expect(() =>
      validateAppSettings({
        ...createDefaultAppSettings("Asia/Singapore"),
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
      })
    ).toThrow(IpcValidationError);
  });

  it("accepts category preferences with supported icon fields", () => {
    const settings = createDefaultAppSettings("Asia/Singapore");

    expect(
      validateAppSettings({
        ...settings,
        categoryPreferences: {
          ...settings.categoryPreferences,
          nutrition: {
            ...settings.categoryPreferences.nutrition,
            icon: "apple",
          },
        },
      }).categoryPreferences.nutrition.icon
    ).toBe("apple");
  });

  it("rejects unsupported category icon ids", () => {
    const settings = createDefaultAppSettings("Asia/Singapore");

    expect(() =>
      validateAppSettings({
        ...settings,
        categoryPreferences: {
          ...settings.categoryPreferences,
          nutrition: {
            ...settings.categoryPreferences.nutrition,
            icon: "sparkles",
          },
        },
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects duplicate habit ids in reorder payloads", () => {
    expect(() => validateReorderHabitIds([1, 1, 2])).toThrow(
      IpcValidationError
    );
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

  it("rejects focus session payloads with impossible completed dates", () => {
    expect(() =>
      validateCreateFocusSessionInput({
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-02-31",
        durationSeconds: 1500,
        entryKind: "completed",
        startedAt: "2026-03-08T09:00:00.000Z",
        timerSessionId: "timer-session-1",
      })
    ).toThrow(IpcValidationError);
  });

  it("rejects invalid focus session limits", () => {
    expect(() => validateFocusSessionLimit(0)).toThrow(IpcValidationError);
  });

  it("accepts the insights dashboard query", () => {
    expect(
      validateHabitQuery({
        payload: { rangeDays: 90 },
        type: "insights.dashboard",
      })
    ).toStrictEqual({
      payload: { rangeDays: 90 },
      type: "insights.dashboard",
    });
  });

  it("rejects empty habit names", () => {
    expect(() => validateHabitName("")).toThrow(IpcValidationError);
    expect(() => validateHabitName("   ")).toThrow(IpcValidationError);
  });

  it("accepts long habit names up to the schema limit", () => {
    expect(validateHabitName("a".repeat(100))).toBe("a".repeat(100));
  });

  it("accepts valid habit names", () => {
    expect(validateHabitName("Morning run")).toBe("Morning run");
    expect(validateHabitName("Read 30 min")).toBe("Read 30 min");
  });

  it("rejects invalid habit ids", () => {
    expect(() => validateHabitId("not-a-number")).toThrow(IpcValidationError);
    expect(() => validateHabitId(-1)).toThrow(IpcValidationError);
    expect(() => validateHabitId(0)).toThrow(IpcValidationError);
    expect(() => validateHabitId(1.5)).toThrow(IpcValidationError);
  });

  it("accepts valid habit ids", () => {
    expect(validateHabitId(1)).toBe(1);
    expect(validateHabitId(42)).toBe(42);
  });

  it("rejects unsupported habit categories", () => {
    expect(() => validateHabitCategory("invalid")).toThrow(IpcValidationError);
    expect(() => validateHabitCategory(null)).toThrow(IpcValidationError);
  });

  it("accepts supported habit categories", () => {
    expect(validateHabitCategory("fitness")).toBe("fitness");
    expect(validateHabitCategory("nutrition")).toBe("nutrition");
    expect(validateHabitCategory("productivity")).toBe("productivity");
  });

  it("rejects unsupported habit frequencies", () => {
    expect(() => validateHabitFrequency("hourly")).toThrow(IpcValidationError);
    expect(() => validateHabitFrequency(null)).toThrow(IpcValidationError);
  });

  it("accepts supported habit frequencies", () => {
    expect(validateHabitFrequency("daily")).toBe("daily");
    expect(validateHabitFrequency("weekly")).toBe("weekly");
    expect(validateHabitFrequency("monthly")).toBe("monthly");
  });

  it("rejects invalid habit target counts", () => {
    expect(() => validateHabitTargetCount(0)).toThrow(IpcValidationError);
    expect(() => validateHabitTargetCount(-1)).toThrow(IpcValidationError);
    expect(() => validateHabitTargetCount(1.5)).toThrow(IpcValidationError);
  });

  it("accepts valid habit target counts", () => {
    expect(validateHabitTargetCount(1)).toBe(1);
    expect(validateHabitTargetCount(5)).toBe(5);
  });

  it("rejects invalid habit weekday values", () => {
    expect(() => validateHabitWeekdays([7])).toThrow(IpcValidationError);
    expect(() => validateHabitWeekdays([0, 0, 1])).toThrow(IpcValidationError);
  });

  it("accepts valid habit weekday arrays", () => {
    expect(validateHabitWeekdays([1, 3, 5])).toStrictEqual([1, 3, 5]);
    expect(validateHabitWeekdays([0, 1, 2, 3, 4, 5, 6])).toStrictEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
  });

  it("rejects reorder payloads with non-numeric ids", () => {
    expect(() => validateReorderHabitIds([1, "two", 3] as never)).toThrow(
      IpcValidationError
    );
  });

  it("accepts reorder payloads with empty arrays", () => {
    expect(validateReorderHabitIds([])).toStrictEqual([]);
  });
});
