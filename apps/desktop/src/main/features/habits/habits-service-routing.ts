import type { HabitsService } from "@/main/features/habits/habits-application-service";
import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type {
  HabitCommand,
  HabitCommandResult,
} from "@/shared/contracts/habits-ipc-commands";
import type {
  HabitQuery,
  HabitQueryResult,
} from "@/shared/contracts/habits-ipc-queries";
import type { TodayState } from "@/shared/contracts/today-state";

function assertNever(value: never): never {
  throw new Error(`Unsupported command or query: ${JSON.stringify(value)}`);
}

function executeFocusQuotaGoalCommand(
  service: HabitsService,
  command: Extract<HabitCommand, { type: `focusQuotaGoal.${string}` }>
): TodayState {
  switch (command.type) {
    case "focusQuotaGoal.archive": {
      return service.archiveFocusQuotaGoal(command.payload.goalId);
    }
    case "focusQuotaGoal.unarchive": {
      return service.unarchiveFocusQuotaGoal(command.payload.goalId);
    }
    case "focusQuotaGoal.upsert": {
      return service.upsertFocusQuotaGoal(
        command.payload.frequency,
        command.payload.targetMinutes
      );
    }
    default: {
      return assertNever(command);
    }
  }
}

function executeHabitCommand(
  service: HabitsService,
  command: Extract<HabitCommand, { type: `habit.${string}` }>
): HabitStatusPatch | TodayState {
  switch (command.type) {
    case "habit.archive": {
      return service.archiveHabit(command.payload.habitId);
    }
    case "habit.create": {
      return service.createHabit(
        command.payload.name,
        command.payload.category,
        command.payload.frequency,
        command.payload.selectedWeekdays,
        command.payload.targetCount
      );
    }
    case "habit.decrementProgress": {
      return service.decrementHabitProgress(command.payload.habitId);
    }
    case "habit.incrementProgress": {
      return service.incrementHabitProgress(command.payload.habitId);
    }
    case "habit.rename": {
      return service.renameHabit(command.payload.habitId, command.payload.name);
    }
    case "habit.reorder": {
      return service.reorderHabits(command.payload.habitIds);
    }
    case "habit.toggle": {
      return service.toggleHabit(command.payload.habitId);
    }
    case "habit.unarchive": {
      return service.unarchiveHabit(command.payload.habitId);
    }
    case "habit.updateCategory": {
      return service.updateHabitCategory(
        command.payload.habitId,
        command.payload.category
      );
    }
    case "habit.updateFrequency": {
      return service.updateHabitFrequency(
        command.payload.habitId,
        command.payload.frequency,
        command.payload.targetCount
      );
    }
    case "habit.updateTargetCount": {
      return service.updateHabitTargetCount(
        command.payload.habitId,
        command.payload.targetCount
      );
    }
    case "habit.updateWeekdays": {
      return service.updateHabitWeekdays(
        command.payload.habitId,
        command.payload.selectedWeekdays
      );
    }
    default: {
      return assertNever(command);
    }
  }
}

function executeWindDownCommand(
  service: HabitsService,
  command: Extract<HabitCommand, { type: `windDown.${string}` }>
): TodayState {
  switch (command.type) {
    case "windDown.createAction": {
      return service.createWindDownAction(command.payload.name);
    }
    case "windDown.deleteAction": {
      return service.deleteWindDownAction(command.payload.actionId);
    }
    case "windDown.renameAction": {
      return service.renameWindDownAction(
        command.payload.actionId,
        command.payload.name
      );
    }
    case "windDown.toggleAction": {
      return service.toggleWindDownAction(command.payload.actionId);
    }
    default: {
      return assertNever(command);
    }
  }
}

export function executeHabitServiceCommand(
  service: HabitsService,
  command: HabitCommand
): HabitCommandResult {
  if (command.type.startsWith("habit.")) {
    return executeHabitCommand(
      service,
      command as Extract<HabitCommand, { type: `habit.${string}` }>
    );
  }

  if (command.type.startsWith("focusQuotaGoal.")) {
    return executeFocusQuotaGoalCommand(
      service,
      command as Extract<HabitCommand, { type: `focusQuotaGoal.${string}` }>
    );
  }

  if (command.type.startsWith("windDown.")) {
    return executeWindDownCommand(
      service,
      command as Extract<HabitCommand, { type: `windDown.${string}` }>
    );
  }

  switch (command.type) {
    case "focusSession.record": {
      return service.recordFocusSession(command.payload);
    }
    case "focusTimer.saveState": {
      return service.savePersistedFocusTimerState(command.payload);
    }
    case "settings.update": {
      return service.updateSettings(command.payload);
    }
    case "today.toggleSickDay": {
      return service.toggleSickDay();
    }
    default: {
      throw new Error(`Unsupported habit command: ${command.type}`);
    }
  }
}

export function readHabitServiceQuery(
  service: HabitsService,
  query: HabitQuery
): HabitQueryResult {
  switch (query.type) {
    case "focusSession.list": {
      return service.getFocusSessions(query.payload?.limit);
    }
    case "focusTimer.getState": {
      return service.getPersistedFocusTimerState();
    }
    case "habit.list": {
      return service.getHabits();
    }
    case "history.get": {
      return service.getHistory(query.payload?.limit);
    }
    case "history.getYear": {
      return service.getHistoryForYear(query.payload.year);
    }
    case "history.getDay": {
      return service.getHistoryDay(query.payload.date);
    }
    case "history.summary": {
      return service.getHistorySummary(query.payload?.limit);
    }
    case "history.years": {
      return service.getHistoryYears();
    }
    case "today.get": {
      return service.getTodayState();
    }
    case "weeklyReview.get": {
      return service.getWeeklyReview(query.payload.weekStart);
    }
    case "weeklyReview.overview": {
      return service.getWeeklyReviewOverview();
    }
    default: {
      return assertNever(query);
    }
  }
}
