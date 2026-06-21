import { addDays } from "@/shared/domain/date-key";
import type { DayStatusKind } from "@/shared/domain/day-status";
import type { GoalFrequency } from "@/shared/domain/goal";
import {
  isValidFocusQuotaTargetMinutes,
  normalizeFocusQuotaTargetMinutes,
  normalizeGoalFrequency,
} from "@/shared/domain/goal";
import {
  isDailyHabit,
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitTargetCount,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { HabitStatusPatch } from "@/shared/read-models/habit-status-patch";
import type { TodayState } from "@/shared/read-models/today-state";

import type { ApplicationServiceRuntime } from "./application-service-runtime";

export class TodayCommandService {
  private readonly runtime: ApplicationServiceRuntime;

  constructor(runtime: ApplicationServiceRuntime) {
    this.runtime = runtime;
  }

  getHabits(): Habit[] {
    return this.runtime.inInitializedTransaction("getHabits", () =>
      this.runtime.repository.habits.getHabits()
    );
  }

  getTodayState(): TodayState {
    return this.runtime.withSyncedRead("getTodayState", () =>
      this.runtime.buildCurrentTodayState()
    );
  }

  setDayStatus(kind: DayStatusKind | null): TodayState {
    return this.runtime.mutateTodayState(
      "setDayStatus",
      (today) => {
        if (!kind) {
          const currentDayStatus =
            this.runtime.repository.history.getDayStatus(today);
          if (currentDayStatus?.kind === "rescheduled") {
            this.runtime.repository.history.clearHabitCarryoversFromSourceDate(
              today
            );
          }

          this.runtime.repository.history.clearDayStatus(today);
          return;
        }

        this.runtime.repository.history.setDayStatus(
          today,
          kind,
          this.runtime.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  moveUnfinishedHabitsToTomorrow(): TodayState {
    return this.runtime.mutateTodayState(
      "moveUnfinishedHabitsToTomorrow",
      (today) => {
        this.runtime.repository.history.ensureStatusRowsForDate(today);
        const unfinishedDailyHabits = this.runtime.repository.history
          .getHabitsWithStatus(today)
          .filter((habit) => isDailyHabit(habit) && !habit.completed);

        if (unfinishedDailyHabits.length === 0) {
          return;
        }

        const nowIso = this.runtime.clock.now().toISOString();
        this.runtime.repository.history.createHabitCarryovers(
          today,
          addDays(today, 1),
          nowIso
        );
        this.runtime.repository.history.setDayStatus(
          today,
          "rescheduled",
          nowIso
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleHabitCarryover(sourceDate: string, habitId: number): TodayState {
    return this.runtime.mutateTodayState(
      "toggleHabitCarryover",
      (today) => {
        this.runtime.repository.history.toggleHabitCarryover(
          today,
          sourceDate,
          habitId,
          this.runtime.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleSickDay(): TodayState {
    return this.runtime.mutateTodayState(
      "toggleSickDay",
      (today) => {
        const currentDayStatus =
          this.runtime.repository.history.getDayStatus(today);
        if (currentDayStatus?.kind === "sick") {
          this.runtime.repository.history.clearDayStatus(today);
          return;
        }

        this.runtime.repository.history.setDayStatus(
          today,
          "sick",
          this.runtime.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleHabit(habitId: number): HabitStatusPatch {
    return this.runtime.mutateHabitStatusPatch(
      "toggleHabit",
      habitId,
      (today) => {
        this.runtime.repository.history.toggleHabit(
          today,
          habitId,
          this.runtime.clock.now().toISOString()
        );
      }
    );
  }

  incrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.runtime.mutateHabitStatusPatch(
      "incrementHabitProgress",
      habitId,
      (today) => {
        this.runtime.repository.history.adjustHabitProgress(
          today,
          habitId,
          1,
          this.runtime.clock.now().toISOString()
        );
      }
    );
  }

  decrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.runtime.mutateHabitStatusPatch(
      "decrementHabitProgress",
      habitId,
      (today) => {
        this.runtime.repository.history.adjustHabitProgress(
          today,
          habitId,
          -1,
          this.runtime.clock.now().toISOString()
        );
      }
    );
  }

  pauseHabit(habitId: number): TodayState {
    return this.runtime.inInitializedTransaction("pauseHabit", () => {
      this.runtime.syncRollingState();
      const today = this.runtime.getTodayKey();
      this.runtime.repository.habits.pauseHabit(
        habitId,
        this.runtime.clock.now().toISOString()
      );
      this.runtime.repository.history.removeStatusRowsForDate(today, habitId);
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  resumeHabit(habitId: number): TodayState {
    return this.runtime.inInitializedTransaction("resumeHabit", () => {
      this.runtime.syncRollingState();
      const today = this.runtime.getTodayKey();
      this.runtime.repository.habits.resumeHabit(
        habitId,
        this.runtime.clock.now().toISOString()
      );
      this.runtime.repository.history.ensureStatusRow(today, habitId);
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays: HabitWeekday[] | null = null,
    targetCount: number | null = null
  ): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.runtime.inInitializedTransaction("createHabit", () => {
      const today = this.runtime.getTodayKey();
      this.runtime.syncRollingState();
      const habitId = this.runtime.repository.habits.insertHabit(
        trimmedName,
        normalizeHabitCategory(category),
        normalizeHabitFrequency(frequency),
        normalizeHabitWeekdays(selectedWeekdays),
        normalizeHabitTargetCount(
          normalizeHabitFrequency(frequency),
          targetCount
        ),
        this.runtime.repository.habits.getMaxSortOrder() + 1,
        this.runtime.clock.now().toISOString()
      );
      const habitIds = [habitId];
      for (const habit of this.runtime.repository.habits.getHabits()) {
        if (habit.id !== habitId) {
          habitIds.push(habit.id);
        }
      }

      this.runtime.repository.habits.reorderHabits(habitIds);
      this.runtime.repository.history.ensureStatusRow(today, habitId);
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  renameHabit(habitId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.runtime.withInitialized(() => {
      this.runtime.repository.habits.renameHabit(habitId, trimmedName);
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    return this.runtime.withInitialized(() => {
      this.runtime.repository.habits.updateHabitCategory(
        habitId,
        normalizeHabitCategory(category)
      );
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null = null
  ): TodayState {
    return this.runtime.inInitializedTransaction("updateHabitFrequency", () => {
      const today = this.runtime.getTodayKey();
      const previousProgress = this.runtime.repository.history.getHabitProgress(
        today,
        habitId
      );
      const normalizedFrequency = normalizeHabitFrequency(frequency);
      const normalizedTargetCount = normalizeHabitTargetCount(
        normalizedFrequency,
        targetCount
      );

      this.runtime.repository.history.removeStatusRowsForDate(today, habitId);
      this.runtime.repository.habits.updateHabitFrequency(
        habitId,
        normalizedFrequency,
        normalizedTargetCount
      );
      this.runtime.preserveTodayHabitProgress(
        today,
        habitId,
        previousProgress,
        normalizedTargetCount
      );
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  updateHabitTargetCount(habitId: number, targetCount: number): TodayState {
    return this.runtime.inInitializedTransaction(
      "updateHabitTargetCount",
      () => {
        const today = this.runtime.getTodayKey();
        const habit = this.runtime.repository.habits
          .getHabits()
          .find((candidate) => candidate.id === habitId);

        if (!habit) {
          return this.runtime.rebuildCurrentTodayState();
        }

        const previousProgress =
          this.runtime.repository.history.getHabitProgress(today, habitId);
        const normalizedTargetCount = normalizeHabitTargetCount(
          habit.frequency,
          targetCount
        );
        this.runtime.repository.habits.updateHabitTargetCount(
          habitId,
          normalizedTargetCount
        );
        this.runtime.preserveTodayHabitProgress(
          today,
          habitId,
          previousProgress,
          normalizedTargetCount
        );
        return this.runtime.rebuildCurrentTodayState();
      }
    );
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState {
    return this.runtime.inInitializedTransaction("updateHabitWeekdays", () => {
      this.runtime.repository.history.removeStatusRowsForDate(
        this.runtime.getTodayKey(),
        habitId
      );
      this.runtime.repository.habits.updateHabitWeekdays(
        habitId,
        normalizeHabitWeekdays(selectedWeekdays)
      );
      this.runtime.repository.history.ensureStatusRow(
        this.runtime.getTodayKey(),
        habitId
      );
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number
  ): TodayState {
    return this.runtime.mutateTodayState(
      "upsertFocusQuotaGoal",
      () => {
        const normalizedFrequency = normalizeGoalFrequency(frequency);
        if (
          !isValidFocusQuotaTargetMinutes(normalizedFrequency, targetMinutes)
        ) {
          throw new RangeError(
            `Invalid ${normalizedFrequency} focus quota target minutes.`
          );
        }

        this.runtime.repository.focusQuotaGoals.upsertGoal(
          normalizedFrequency,
          normalizeFocusQuotaTargetMinutes(normalizedFrequency, targetMinutes),
          this.runtime.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  archiveFocusQuotaGoal(goalId: number): TodayState {
    return this.runtime.mutateTodayState(
      "archiveFocusQuotaGoal",
      () => {
        this.runtime.repository.focusQuotaGoals.archiveGoal(
          goalId,
          this.runtime.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  unarchiveFocusQuotaGoal(goalId: number): TodayState {
    return this.runtime.mutateTodayState(
      "unarchiveFocusQuotaGoal",
      () => {
        this.runtime.repository.focusQuotaGoals.unarchiveGoal(
          goalId,
          this.runtime.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  archiveHabit(habitId: number): TodayState {
    return this.runtime.inInitializedTransaction("archiveHabit", () => {
      this.runtime.repository.habits.archiveHabit(habitId);
      this.runtime.repository.habits.normalizeHabitOrder();
      this.runtime.syncRollingState();
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  unarchiveHabit(habitId: number): TodayState {
    return this.runtime.inInitializedTransaction("unarchiveHabit", () => {
      this.runtime.repository.habits.unarchiveHabit(habitId);
      const habitIds: number[] = [];
      for (const habit of this.runtime.repository.habits.getHabits()) {
        if (habit.id !== habitId) {
          habitIds.push(habit.id);
        }
      }
      habitIds.push(habitId);

      this.runtime.repository.habits.reorderHabits(habitIds);
      this.runtime.repository.history.ensureStatusRow(
        this.runtime.getTodayKey(),
        habitId
      );
      this.runtime.syncRollingState();
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  reorderHabits(habitIds: number[]): TodayState {
    return this.runtime.inInitializedTransaction("reorderHabits", () => {
      const activeHabits = this.runtime.repository.habits.getHabits();
      const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));

      if (
        habitIds.length !== activeHabits.length ||
        habitIds.some((habitId) => !activeHabitIds.has(habitId))
      ) {
        return this.runtime.rebuildCurrentTodayState();
      }

      this.runtime.repository.habits.reorderHabits(habitIds);
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  createWindDownAction(name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.runtime.inInitializedTransaction("createWindDownAction", () => {
      this.runtime.repository.windDownActions.createAction(
        trimmedName,
        this.runtime.clock.now().toISOString()
      );
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  renameWindDownAction(actionId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.runtime.withInitialized(() => {
      this.runtime.repository.windDownActions.renameAction(
        actionId,
        trimmedName
      );
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  deleteWindDownAction(actionId: number): TodayState {
    return this.runtime.inInitializedTransaction("deleteWindDownAction", () => {
      this.runtime.repository.windDownActions.deleteAction(actionId);
      return this.runtime.rebuildCurrentTodayState();
    });
  }

  toggleWindDownAction(actionId: number): TodayState {
    return this.runtime.inInitializedTransaction("toggleWindDownAction", () => {
      const today = this.runtime.getTodayKey();
      this.runtime.repository.windDownActions.ensureStatusRowsForDate(today);
      this.runtime.repository.windDownActions.toggleAction(
        today,
        actionId,
        this.runtime.clock.now().toISOString()
      );
      return this.runtime.rebuildCurrentTodayState();
    });
  }
}
