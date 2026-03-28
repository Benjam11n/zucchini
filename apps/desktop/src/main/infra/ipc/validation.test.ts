import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import {
  IpcValidationError,
  validateAppSettings,
  validateCreateFocusSessionInput,
  validateFocusSessionLimit,
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

  it("rejects invalid focus session limits", () => {
    expect(() => validateFocusSessionLimit(0)).toThrow(IpcValidationError);
  });
});
