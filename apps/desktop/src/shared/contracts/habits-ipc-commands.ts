import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { GoalFrequency } from "@/shared/domain/goal";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

import type { TodayState } from "./today-state";

export type HabitCommand =
  | { payload: { goalId: number }; type: "focusQuotaGoal.archive" }
  | { payload: { goalId: number }; type: "focusQuotaGoal.unarchive" }
  | {
      payload: { frequency: GoalFrequency; targetMinutes: number };
      type: "focusQuotaGoal.upsert";
    }
  | { payload: CreateFocusSessionInput; type: "focusSession.record" }
  | { payload: PersistedFocusTimerState; type: "focusTimer.saveState" }
  | {
      payload: {
        category: HabitCategory;
        frequency: HabitFrequency;
        name: string;
        selectedWeekdays?: HabitWeekday[] | null | undefined;
        targetCount?: number | null | undefined;
      };
      type: "habit.create";
    }
  | { payload: { habitId: number }; type: "habit.archive" }
  | { payload: { habitId: number }; type: "habit.decrementProgress" }
  | { payload: { habitId: number }; type: "habit.incrementProgress" }
  | { payload: { habitId: number; name: string }; type: "habit.rename" }
  | { payload: { habitIds: number[] }; type: "habit.reorder" }
  | { payload: { habitId: number }; type: "habit.toggle" }
  | { payload: { habitId: number }; type: "habit.unarchive" }
  | {
      payload: { category: HabitCategory; habitId: number };
      type: "habit.updateCategory";
    }
  | {
      payload: {
        frequency: HabitFrequency;
        habitId: number;
        targetCount?: number | null | undefined;
      };
      type: "habit.updateFrequency";
    }
  | {
      payload: { habitId: number; targetCount: number };
      type: "habit.updateTargetCount";
    }
  | {
      payload: { habitId: number; selectedWeekdays: HabitWeekday[] | null };
      type: "habit.updateWeekdays";
    }
  | { payload: AppSettings; type: "settings.update" }
  | { type: "today.toggleSickDay" }
  | { payload: { name: string }; type: "windDown.createAction" }
  | { payload: { actionId: number }; type: "windDown.deleteAction" }
  | {
      payload: { actionId: number; name: string };
      type: "windDown.renameAction";
    }
  | { payload: { actionId: number }; type: "windDown.toggleAction" };

export type HabitCommandResult =
  | AppSettings
  | FocusSession
  | PersistedFocusTimerState
  | TodayState;

interface HabitCommandResultByType {
  "focusQuotaGoal.archive": TodayState;
  "focusQuotaGoal.unarchive": TodayState;
  "focusQuotaGoal.upsert": TodayState;
  "focusSession.record": FocusSession;
  "focusTimer.saveState": PersistedFocusTimerState;
  "habit.archive": TodayState;
  "habit.create": TodayState;
  "habit.decrementProgress": TodayState;
  "habit.incrementProgress": TodayState;
  "habit.rename": TodayState;
  "habit.reorder": TodayState;
  "habit.toggle": TodayState;
  "habit.unarchive": TodayState;
  "habit.updateCategory": TodayState;
  "habit.updateFrequency": TodayState;
  "habit.updateTargetCount": TodayState;
  "habit.updateWeekdays": TodayState;
  "settings.update": AppSettings;
  "today.toggleSickDay": TodayState;
  "windDown.createAction": TodayState;
  "windDown.deleteAction": TodayState;
  "windDown.renameAction": TodayState;
  "windDown.toggleAction": TodayState;
}

export type ResultForCommand<C extends HabitCommand> =
  HabitCommandResultByType[C["type"]];
