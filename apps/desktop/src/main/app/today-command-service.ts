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

import { ApplicationServiceSlice } from "./application-service-slice";

export class TodayCommandService extends ApplicationServiceSlice {
  getHabits(): Habit[] {
    return this.inInitializedTransaction("getHabits", () =>
      this.repository.habits.getHabits()
    );
  }

  getTodayState(): TodayState {
    return this.withSyncedRead("getTodayState", () =>
      this.buildCurrentTodayState()
    );
  }

  setDayStatus(kind: DayStatusKind | null): TodayState {
    return this.mutateTodayState(
      "setDayStatus",
      (today) => {
        if (!kind) {
          const currentDayStatus = this.repository.history.getDayStatus(today);
          if (currentDayStatus?.kind === "rescheduled") {
            this.repository.history.clearHabitCarryoversFromSourceDate(today);
          }

          this.repository.history.clearDayStatus(today);
          return;
        }

        this.repository.history.setDayStatus(
          today,
          kind,
          this.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  moveUnfinishedHabitsToTomorrow(): TodayState {
    return this.mutateTodayState(
      "moveUnfinishedHabitsToTomorrow",
      (today) => {
        this.repository.history.ensureStatusRowsForDate(today);
        const unfinishedDailyHabits = this.repository.history
          .getHabitsWithStatus(today)
          .filter((habit) => isDailyHabit(habit) && !habit.completed);

        if (unfinishedDailyHabits.length === 0) {
          return;
        }

        const nowIso = this.clock.now().toISOString();
        this.repository.history.createHabitCarryovers(
          today,
          addDays(today, 1),
          nowIso
        );
        this.repository.history.setDayStatus(today, "rescheduled", nowIso);
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleHabitCarryover(sourceDate: string, habitId: number): TodayState {
    return this.mutateTodayState(
      "toggleHabitCarryover",
      (today) => {
        this.repository.history.toggleHabitCarryover(
          today,
          sourceDate,
          habitId,
          this.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleSickDay(): TodayState {
    return this.mutateTodayState(
      "toggleSickDay",
      (today) => {
        const currentDayStatus = this.repository.history.getDayStatus(today);
        if (currentDayStatus?.kind === "sick") {
          this.repository.history.clearDayStatus(today);
          return;
        }

        this.repository.history.setDayStatus(
          today,
          "sick",
          this.clock.now().toISOString()
        );
      },
      {
        ensureStatusRowsForToday: true,
        syncRollingState: true,
      }
    );
  }

  toggleHabit(habitId: number): HabitStatusPatch {
    return this.mutateHabitStatusPatch("toggleHabit", habitId, (today) => {
      this.repository.history.toggleHabit(
        today,
        habitId,
        this.clock.now().toISOString()
      );
    });
  }

  incrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.mutateHabitStatusPatch(
      "incrementHabitProgress",
      habitId,
      (today) => {
        this.repository.history.adjustHabitProgress(
          today,
          habitId,
          1,
          this.clock.now().toISOString()
        );
      }
    );
  }

  decrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.mutateHabitStatusPatch(
      "decrementHabitProgress",
      habitId,
      (today) => {
        this.repository.history.adjustHabitProgress(
          today,
          habitId,
          -1,
          this.clock.now().toISOString()
        );
      }
    );
  }

  pauseHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("pauseHabit", () => {
      this.syncRollingState();
      const today = this.getTodayKey();
      this.repository.habits.pauseHabit(
        habitId,
        this.clock.now().toISOString()
      );
      this.repository.history.removeStatusRowsForDate(today, habitId);
      return this.rebuildCurrentTodayState();
    });
  }

  resumeHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("resumeHabit", () => {
      this.syncRollingState();
      const today = this.getTodayKey();
      this.repository.habits.resumeHabit(
        habitId,
        this.clock.now().toISOString()
      );
      this.repository.history.ensureStatusRow(today, habitId);
      return this.rebuildCurrentTodayState();
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

    return this.inInitializedTransaction("createHabit", () => {
      const today = this.getTodayKey();
      this.syncRollingState();
      const habitId = this.repository.habits.insertHabit(
        trimmedName,
        normalizeHabitCategory(category),
        normalizeHabitFrequency(frequency),
        normalizeHabitWeekdays(selectedWeekdays),
        normalizeHabitTargetCount(
          normalizeHabitFrequency(frequency),
          targetCount
        ),
        this.repository.habits.getMaxSortOrder() + 1,
        this.clock.now().toISOString()
      );
      const habitIds = [habitId];
      for (const habit of this.repository.habits.getHabits()) {
        if (habit.id !== habitId) {
          habitIds.push(habit.id);
        }
      }

      this.repository.habits.reorderHabits(habitIds);
      this.repository.history.ensureStatusRow(today, habitId);
      return this.rebuildCurrentTodayState();
    });
  }

  renameHabit(habitId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.withInitialized(() => {
      this.repository.habits.renameHabit(habitId, trimmedName);
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    return this.withInitialized(() => {
      this.repository.habits.updateHabitCategory(
        habitId,
        normalizeHabitCategory(category)
      );
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null = null
  ): TodayState {
    return this.inInitializedTransaction("updateHabitFrequency", () => {
      const today = this.getTodayKey();
      const previousProgress = this.repository.history.getHabitProgress(
        today,
        habitId
      );
      const normalizedFrequency = normalizeHabitFrequency(frequency);
      const normalizedTargetCount = normalizeHabitTargetCount(
        normalizedFrequency,
        targetCount
      );

      this.repository.history.removeStatusRowsForDate(today, habitId);
      this.repository.habits.updateHabitFrequency(
        habitId,
        normalizedFrequency,
        normalizedTargetCount
      );
      this.preserveTodayHabitProgress(
        today,
        habitId,
        previousProgress,
        normalizedTargetCount
      );
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitTargetCount(habitId: number, targetCount: number): TodayState {
    return this.inInitializedTransaction("updateHabitTargetCount", () => {
      const today = this.getTodayKey();
      const habit = this.repository.habits
        .getHabits()
        .find((candidate) => candidate.id === habitId);

      if (!habit) {
        return this.rebuildCurrentTodayState();
      }

      const previousProgress = this.repository.history.getHabitProgress(
        today,
        habitId
      );
      const normalizedTargetCount = normalizeHabitTargetCount(
        habit.frequency,
        targetCount
      );
      this.repository.habits.updateHabitTargetCount(
        habitId,
        normalizedTargetCount
      );
      this.preserveTodayHabitProgress(
        today,
        habitId,
        previousProgress,
        normalizedTargetCount
      );
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState {
    return this.inInitializedTransaction("updateHabitWeekdays", () => {
      this.repository.history.removeStatusRowsForDate(
        this.getTodayKey(),
        habitId
      );
      this.repository.habits.updateHabitWeekdays(
        habitId,
        normalizeHabitWeekdays(selectedWeekdays)
      );
      this.repository.history.ensureStatusRow(this.getTodayKey(), habitId);
      return this.rebuildCurrentTodayState();
    });
  }

  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number
  ): TodayState {
    return this.mutateTodayState(
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

        this.repository.focusQuotaGoals.upsertGoal(
          normalizedFrequency,
          normalizeFocusQuotaTargetMinutes(normalizedFrequency, targetMinutes),
          this.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  archiveFocusQuotaGoal(goalId: number): TodayState {
    return this.mutateTodayState(
      "archiveFocusQuotaGoal",
      () => {
        this.repository.focusQuotaGoals.archiveGoal(
          goalId,
          this.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  unarchiveFocusQuotaGoal(goalId: number): TodayState {
    return this.mutateTodayState(
      "unarchiveFocusQuotaGoal",
      () => {
        this.repository.focusQuotaGoals.unarchiveGoal(
          goalId,
          this.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  archiveHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("archiveHabit", () => {
      this.repository.habits.archiveHabit(habitId);
      this.repository.habits.normalizeHabitOrder();
      this.syncRollingState();
      return this.rebuildCurrentTodayState();
    });
  }

  unarchiveHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("unarchiveHabit", () => {
      this.repository.habits.unarchiveHabit(habitId);
      const habitIds: number[] = [];
      for (const habit of this.repository.habits.getHabits()) {
        if (habit.id !== habitId) {
          habitIds.push(habit.id);
        }
      }
      habitIds.push(habitId);

      this.repository.habits.reorderHabits(habitIds);
      this.repository.history.ensureStatusRow(this.getTodayKey(), habitId);
      this.syncRollingState();
      return this.rebuildCurrentTodayState();
    });
  }

  reorderHabits(habitIds: number[]): TodayState {
    return this.inInitializedTransaction("reorderHabits", () => {
      const activeHabits = this.repository.habits.getHabits();
      const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));

      if (
        habitIds.length !== activeHabits.length ||
        habitIds.some((habitId) => !activeHabitIds.has(habitId))
      ) {
        return this.rebuildCurrentTodayState();
      }

      this.repository.habits.reorderHabits(habitIds);
      return this.rebuildCurrentTodayState();
    });
  }

  createWindDownAction(name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.inInitializedTransaction("createWindDownAction", () => {
      this.repository.windDownActions.createAction(
        trimmedName,
        this.clock.now().toISOString()
      );
      return this.rebuildCurrentTodayState();
    });
  }

  renameWindDownAction(actionId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.withInitialized(() => {
      this.repository.windDownActions.renameAction(actionId, trimmedName);
      return this.rebuildCurrentTodayState();
    });
  }

  deleteWindDownAction(actionId: number): TodayState {
    return this.inInitializedTransaction("deleteWindDownAction", () => {
      this.repository.windDownActions.deleteAction(actionId);
      return this.rebuildCurrentTodayState();
    });
  }

  toggleWindDownAction(actionId: number): TodayState {
    return this.inInitializedTransaction("toggleWindDownAction", () => {
      const today = this.getTodayKey();
      this.repository.windDownActions.ensureStatusRowsForDate(today);
      this.repository.windDownActions.toggleAction(
        today,
        actionId,
        this.clock.now().toISOString()
      );
      return this.rebuildCurrentTodayState();
    });
  }
}
