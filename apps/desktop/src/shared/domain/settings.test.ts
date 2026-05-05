import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import {
  createDefaultHabitCategoryPreferences,
  createDefaultAppSettings,
  createDefaultFocusTimerShortcutSettings,
  isValidGlobalShortcutAccelerator,
  normalizeGlobalShortcutAccelerator,
} from "@/shared/domain/settings";

describe("focus timer shortcut settings", () => {
  it("adds default global shortcuts to the app settings", () => {
    expect(createDefaultAppSettings("Asia/Singapore")).toMatchObject({
      categoryPreferences: createDefaultHabitCategoryPreferences(),
      resetFocusTimerShortcut: expect.any(String),
      toggleFocusTimerShortcut: expect.any(String),
    });
  });

  it("uses platform-specific defaults", () => {
    expect(createDefaultFocusTimerShortcutSettings("darwin")).toStrictEqual({
      resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
      toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
    });
    expect(createDefaultFocusTimerShortcutSettings("win32")).toStrictEqual({
      resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.other.reset,
      toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.other.toggle,
    });
  });

  it("accepts supported accelerator strings", () => {
    expect(
      isValidGlobalShortcutAccelerator(
        FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle
      )
    ).toBe(true);
    expect(
      isValidGlobalShortcutAccelerator(
        FOCUS_TIMER_SHORTCUT_DEFAULTS.other.reset
      )
    ).toBe(true);
  });

  it("rejects malformed or unsupported accelerator strings", () => {
    expect(isValidGlobalShortcutAccelerator("")).toBe(false);
    expect(isValidGlobalShortcutAccelerator("Command+Option")).toBe(false);
    expect(isValidGlobalShortcutAccelerator("Globe+Space")).toBe(false);
    expect(isValidGlobalShortcutAccelerator("Fn+Space")).toBe(false);
  });

  it("normalizes accelerators for duplicate detection", () => {
    expect(normalizeGlobalShortcutAccelerator("Option+Command+Space")).toBe(
      "command+option+space"
    );
    expect(normalizeGlobalShortcutAccelerator("Globe+Space")).toBeNull();
  });

  it("provides default category labels and colors", () => {
    expect(createDefaultHabitCategoryPreferences()).toStrictEqual({
      fitness: {
        color: "#FF2D55",
        icon: "dumbbell",
        label: "Fitness",
      },
      nutrition: {
        color: "#78C500",
        icon: "utensils",
        label: "Nutrition",
      },
      productivity: {
        color: "#04C7DD",
        icon: "zap",
        label: "Productivity",
      },
    });
  });
});
