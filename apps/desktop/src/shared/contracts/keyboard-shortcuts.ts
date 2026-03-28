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
