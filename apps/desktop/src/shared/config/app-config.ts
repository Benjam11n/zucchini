interface NumberRange {
  max: number;
  min: number;
}

interface AppConfig {
  focus: {
    cyclesRange: NumberRange;
    defaultCyclesBeforeLongBreak: number;
    defaultDurations: {
      focusSeconds: number;
      longBreakSeconds: number;
      shortBreakSeconds: number;
    };
    durationRanges: {
      breakSeconds: NumberRange;
      focusSeconds: NumberRange;
    };
  };
  reminders: {
    defaultSnoozeMinutes: number;
    defaultTime: string;
    snoozeRange: NumberRange;
  };
  streaks: {
    freezeAwards: {
      monthlyStreakDays: number;
      weeklyStreakDays: number;
    };
    initialAvailableFreezes: number;
  };
  windDown: {
    defaultTime: string;
  };
}

export const APP_CONFIG = {
  focus: {
    cyclesRange: {
      max: 12,
      min: 1,
    },
    defaultCyclesBeforeLongBreak: 2,
    defaultDurations: {
      focusSeconds: 45 * 60,
      longBreakSeconds: 30 * 60,
      shortBreakSeconds: 10 * 60,
    },
    durationRanges: {
      breakSeconds: {
        max: 60 * 60,
        min: 1,
      },
      focusSeconds: {
        max: 60 * 60,
        min: 1,
      },
    },
  },
  reminders: {
    defaultSnoozeMinutes: 15,
    defaultTime: "20:30",
    snoozeRange: {
      max: 240,
      min: 1,
    },
  },
  streaks: {
    freezeAwards: {
      monthlyStreakDays: 30,
      weeklyStreakDays: 7,
    },
    initialAvailableFreezes: 1,
  },
  windDown: {
    defaultTime: "21:30",
  },
} as const satisfies AppConfig;
