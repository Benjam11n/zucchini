/**
 * Keyboard shortcut defaults and reference constants.
 *
 * Defines platform-specific default accelerators for focus timer toggle
 * and reset. The reference constants are used for display in the settings
 * UI and as a fallback when user-configured shortcuts fail validation.
 */
export const FOCUS_TIMER_SHORTCUT_DEFAULTS = {
  darwin: {
    reset: "Command+Shift+Backspace",
    toggle: "Command+Shift+Space",
  },
  other: {
    reset: "Control+Alt+Backspace",
    toggle: "Control+Alt+Space",
  },
} as const;

export const FOCUS_TIMER_SHORTCUT_REFERENCE = {
  reset: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  toggle: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
} as const;
