import type { ApplicationService } from "@/main/ports/application-service";
import type {
  AppCommand,
  AppCommandResult,
  AppCommandType,
  PayloadForAppCommandType,
  ResultForAppCommandType,
} from "@/shared/contracts/ipc/app-command-registry";
import type {
  AppQuery,
  AppQueryResult,
  AppQueryType,
  PayloadForAppQueryType,
  ResultForAppQueryType,
} from "@/shared/contracts/ipc/app-query-registry";

type AppCommandHandler<TType extends AppCommandType> = [
  PayloadForAppCommandType<TType>,
] extends [never]
  ? (service: ApplicationService) => ResultForAppCommandType<TType>
  : (
      service: ApplicationService,
      payload: PayloadForAppCommandType<TType>
    ) => ResultForAppCommandType<TType>;

type AppCommandHandlers = {
  [TType in AppCommandType]: AppCommandHandler<TType>;
};

type AppQueryHandler<TType extends AppQueryType> = [
  PayloadForAppQueryType<TType>,
] extends [never]
  ? (service: ApplicationService) => ResultForAppQueryType<TType>
  : (
      service: ApplicationService,
      payload: PayloadForAppQueryType<TType>
    ) => ResultForAppQueryType<TType>;

type AppQueryHandlers = {
  [TType in AppQueryType]: AppQueryHandler<TType>;
};

const appCommandHandlers = {
  "focusQuotaGoal.archive": (service, payload) =>
    service.archiveFocusQuotaGoal(payload.goalId),
  "focusQuotaGoal.unarchive": (service, payload) =>
    service.unarchiveFocusQuotaGoal(payload.goalId),
  "focusQuotaGoal.upsert": (service, payload) =>
    service.upsertFocusQuotaGoal(payload.frequency, payload.targetMinutes),
  "focusSession.record": (service, payload) =>
    service.recordFocusSession(payload),
  "focusTimer.saveState": (service, payload) =>
    service.savePersistedFocusTimerState(payload),
  "habit.archive": (service, payload) => service.archiveHabit(payload.habitId),
  "habit.create": (service, payload) =>
    service.createHabit(
      payload.name,
      payload.category,
      payload.frequency,
      payload.selectedWeekdays,
      payload.targetCount
    ),
  "habit.decrementProgress": (service, payload) =>
    service.decrementHabitProgress(payload.habitId),
  "habit.incrementProgress": (service, payload) =>
    service.incrementHabitProgress(payload.habitId),
  "habit.pause": (service, payload) => service.pauseHabit(payload.habitId),
  "habit.rename": (service, payload) =>
    service.renameHabit(payload.habitId, payload.name),
  "habit.reorder": (service, payload) =>
    service.reorderHabits(payload.habitIds),
  "habit.resume": (service, payload) => service.resumeHabit(payload.habitId),
  "habit.toggle": (service, payload) => service.toggleHabit(payload.habitId),
  "habit.unarchive": (service, payload) =>
    service.unarchiveHabit(payload.habitId),
  "habit.updateCategory": (service, payload) =>
    service.updateHabitCategory(payload.habitId, payload.category),
  "habit.updateFrequency": (service, payload) =>
    service.updateHabitFrequency(
      payload.habitId,
      payload.frequency,
      payload.targetCount
    ),
  "habit.updateTargetCount": (service, payload) =>
    service.updateHabitTargetCount(payload.habitId, payload.targetCount),
  "habit.updateWeekdays": (service, payload) =>
    service.updateHabitWeekdays(payload.habitId, payload.selectedWeekdays),
  "settings.update": (service, payload) => service.updateSettings(payload),
  "today.moveUnfinishedToTomorrow": (service) =>
    service.moveUnfinishedHabitsToTomorrow(),
  "today.setDayStatus": (service, payload) =>
    service.setDayStatus(payload.kind),
  "today.toggleCarryover": (service, payload) =>
    service.toggleHabitCarryover(payload.sourceDate, payload.habitId),
  "today.toggleSickDay": (service) => service.toggleSickDay(),
  "windDown.createAction": (service, payload) =>
    service.createWindDownAction(payload.name),
  "windDown.deleteAction": (service, payload) =>
    service.deleteWindDownAction(payload.actionId),
  "windDown.renameAction": (service, payload) =>
    service.renameWindDownAction(payload.actionId, payload.name),
  "windDown.toggleAction": (service, payload) =>
    service.toggleWindDownAction(payload.actionId),
} satisfies AppCommandHandlers;

const appQueryHandlers = {
  "focusSession.list": (service, payload) =>
    service.getFocusSessions(payload?.limit),
  "focusTimer.getState": (service) => service.getPersistedFocusTimerState(),
  "habit.list": (service) => service.getHabits(),
  "history.get": (service, payload) => service.getHistory(payload?.limit),
  "history.getDay": (service, payload) => service.getHistoryDay(payload.date),
  "history.getYear": (service, payload) =>
    service.getHistoryForYear(payload.year),
  "history.summary": (service, payload) =>
    service.getHistorySummary(payload?.limit),
  "history.summaryMonth": (service, payload) =>
    service.getHistorySummaryForMonth(payload.year, payload.month),
  "history.summaryYear": (service, payload) =>
    service.getHistorySummaryForYear(payload.year),
  "history.years": (service) => service.getHistoryYears(),
  "insights.dashboard": (service, payload) =>
    service.getInsightsDashboard(payload?.rangeDays),
  "today.get": (service) => service.getTodayState(),
  "weeklyReview.get": (service, payload) =>
    service.getWeeklyReview(payload.weekStart),
  "weeklyReview.overview": (service) => service.getWeeklyReviewOverview(),
} satisfies AppQueryHandlers;

export function executeAppServiceCommand(
  service: ApplicationService,
  command: AppCommand
): AppCommandResult {
  const handler = appCommandHandlers[command.type] as (
    service: ApplicationService,
    payload?: unknown
  ) => AppCommandResult;

  return "payload" in command
    ? handler(service, command.payload)
    : handler(service);
}

export function readAppServiceQuery(
  service: ApplicationService,
  query: AppQuery
): AppQueryResult {
  const handler = appQueryHandlers[query.type] as (
    service: ApplicationService,
    payload?: unknown
  ) => AppQueryResult;

  return "payload" in query
    ? handler(service, query.payload)
    : handler(service);
}
