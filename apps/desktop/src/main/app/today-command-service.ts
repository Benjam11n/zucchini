import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { TodayState } from "@/shared/contracts/today-state";
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
import { addDays } from "@/shared/utils/date";

import { ApplicationServiceSlice } from "./application-service-slice";

export class TodayCommandService extends ApplicationServiceSlice {
  getHabits(): Habit[] {
    return this.inInitializedTransaction("getHabits", () =>
      this.repository.getHabits()
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
          const currentDayStatus = this.repository.getDayStatus(today);
          if (currentDayStatus?.kind === "rescheduled") {
            this.repository.clearHabitCarryoversFromSourceDate(today);
          }

          this.repository.clearDayStatus(today);
          return;
        }

        this.repository.setDayStatus(
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
        this.repository.ensureStatusRowsForDate(today);
        const unfinishedDailyHabits = this.repository
          .getHabitsWithStatus(today)
          .filter((habit) => isDailyHabit(habit) && !habit.completed);

        if (unfinishedDailyHabits.length === 0) {
          return;
        }

        const nowIso = this.clock.now().toISOString();
        this.repository.createHabitCarryovers(today, addDays(today, 1), nowIso);
        this.repository.setDayStatus(today, "rescheduled", nowIso);
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
        this.repository.toggleHabitCarryover(
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
        const currentDayStatus = this.repository.getDayStatus(today);
        if (currentDayStatus?.kind === "sick") {
          this.repository.clearDayStatus(today);
          return;
        }

        this.repository.setDayStatus(
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
      this.repository.toggleHabit(
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
        this.repository.adjustHabitProgress(
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
        this.repository.adjustHabitProgress(
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
      this.repository.pauseHabit(habitId, this.clock.now().toISOString());
      this.repository.removeStatusRowsForDate(today, habitId);
      return this.rebuildCurrentTodayState();
    });
  }

  resumeHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("resumeHabit", () => {
      this.syncRollingState();
      const today = this.getTodayKey();
      this.repository.resumeHabit(habitId, this.clock.now().toISOString());
      this.repository.ensureStatusRow(today, habitId);
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
      const habitId = this.repository.insertHabit(
        trimmedName,
        normalizeHabitCategory(category),
        normalizeHabitFrequency(frequency),
        normalizeHabitWeekdays(selectedWeekdays),
        normalizeHabitTargetCount(
          normalizeHabitFrequency(frequency),
          targetCount
        ),
        this.repository.getMaxSortOrder() + 1,
        this.clock.now().toISOString()
      );
      this.repository.reorderHabits([
        habitId,
        ...this.repository
          .getHabits()
          .filter((habit) => habit.id !== habitId)
          .map((habit) => habit.id),
      ]);
      this.repository.ensureStatusRow(today, habitId);
      return this.rebuildCurrentTodayState();
    });
  }

  renameHabit(habitId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.withInitialized(() => {
      this.repository.renameHabit(habitId, trimmedName);
      return this.rebuildCurrentTodayState();
    });
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    return this.withInitialized(() => {
      this.repository.updateHabitCategory(
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
      const previousProgress = this.repository.getHabitProgress(today, habitId);
      const normalizedFrequency = normalizeHabitFrequency(frequency);
      const normalizedTargetCount = normalizeHabitTargetCount(
        normalizedFrequency,
        targetCount
      );

      this.repository.removeStatusRowsForDate(today, habitId);
      this.repository.updateHabitFrequency(
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
      const habit = this.repository
        .getHabits()
        .find((candidate) => candidate.id === habitId);

      if (!habit) {
        return this.rebuildCurrentTodayState();
      }

      const previousProgress = this.repository.getHabitProgress(today, habitId);
      const normalizedTargetCount = normalizeHabitTargetCount(
        habit.frequency,
        targetCount
      );
      this.repository.updateHabitTargetCount(habitId, normalizedTargetCount);
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
      this.repository.removeStatusRowsForDate(this.getTodayKey(), habitId);
      this.repository.updateHabitWeekdays(
        habitId,
        normalizeHabitWeekdays(selectedWeekdays)
      );
      this.repository.ensureStatusRow(this.getTodayKey(), habitId);
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

        this.repository.upsertFocusQuotaGoal(
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
        this.repository.archiveFocusQuotaGoal(
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
        this.repository.unarchiveFocusQuotaGoal(
          goalId,
          this.clock.now().toISOString()
        );
      },
      { syncRollingState: true }
    );
  }

  archiveHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("archiveHabit", () => {
      this.repository.archiveHabit(habitId);
      this.repository.normalizeHabitOrder();
      this.syncRollingState();
      return this.rebuildCurrentTodayState();
    });
  }

  unarchiveHabit(habitId: number): TodayState {
    return this.inInitializedTransaction("unarchiveHabit", () => {
      this.repository.unarchiveHabit(habitId);
      this.repository.reorderHabits([
        ...this.repository
          .getHabits()
          .filter((habit) => habit.id !== habitId)
          .map((habit) => habit.id),
        habitId,
      ]);
      this.repository.ensureStatusRow(this.getTodayKey(), habitId);
      this.syncRollingState();
      return this.rebuildCurrentTodayState();
    });
  }

  reorderHabits(habitIds: number[]): TodayState {
    return this.inInitializedTransaction("reorderHabits", () => {
      const activeHabits = this.repository.getHabits();
      const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));

      if (
        habitIds.length !== activeHabits.length ||
        habitIds.some((habitId) => !activeHabitIds.has(habitId))
      ) {
        return this.rebuildCurrentTodayState();
      }

      this.repository.reorderHabits(habitIds);
      return this.rebuildCurrentTodayState();
    });
  }

  createWindDownAction(name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.inInitializedTransaction("createWindDownAction", () => {
      this.repository.createWindDownAction(
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
      this.repository.renameWindDownAction(actionId, trimmedName);
      return this.rebuildCurrentTodayState();
    });
  }

  deleteWindDownAction(actionId: number): TodayState {
    return this.inInitializedTransaction("deleteWindDownAction", () => {
      this.repository.deleteWindDownAction(actionId);
      return this.rebuildCurrentTodayState();
    });
  }

  toggleWindDownAction(actionId: number): TodayState {
    return this.inInitializedTransaction("toggleWindDownAction", () => {
      const today = this.getTodayKey();
      this.repository.ensureWindDownStatusRowsForDate(today);
      this.repository.toggleWindDownAction(
        today,
        actionId,
        this.clock.now().toISOString()
      );
      return this.rebuildCurrentTodayState();
    });
  }
}
