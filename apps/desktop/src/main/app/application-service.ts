import type { AppRepository } from "@/main/infra/persistence/sqlite-app-repository";
import type { ApplicationService } from "@/main/ports/application-service";
import type {
  AppCommand,
  ResultForAppCommandType,
} from "@/shared/contracts/ipc/app-command-registry";
import type {
  AppQuery,
  ResultForAppQueryType,
} from "@/shared/contracts/ipc/app-query-registry";
import type { Clock } from "@/shared/domain/clock";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";

import { ApplicationServiceRuntime } from "./application-service-runtime";
import { FocusApplicationService } from "./focus-application-service";
import { HistoryReadService } from "./history-read-service";
import { TodayCommandService } from "./today-command-service";

type CommandHandlers = {
  [K in AppCommand["type"]]: (
    item: Extract<AppCommand, { type: K }>
  ) => ResultForAppCommandType<K>;
};
type QueryHandlers = {
  [K in AppQuery["type"]]: (
    item: Extract<AppQuery, { type: K }>
  ) => ResultForAppQueryType<K>;
};

export class AppApplicationService implements ApplicationService {
  private readonly runtime: ApplicationServiceRuntime;
  private readonly today: TodayCommandService;
  private readonly focus: FocusApplicationService;
  private readonly history: HistoryReadService;
  constructor(repository: AppRepository, clock: Clock) {
    this.runtime = new ApplicationServiceRuntime(repository, clock);
    this.today = new TodayCommandService(this.runtime);
    this.focus = new FocusApplicationService(this.runtime);
    this.history = new HistoryReadService(this.runtime);
  }
  initialize(): void {
    this.runtime.initialize();
  }
  private readonly executeHandlers: CommandHandlers = {
    "focusQuotaGoal.archive": (item) =>
      this.today.archiveFocusQuotaGoal(item.payload.goalId),
    "focusQuotaGoal.unarchive": (item) =>
      this.today.unarchiveFocusQuotaGoal(item.payload.goalId),
    "focusQuotaGoal.upsert": (item) =>
      this.today.upsertFocusQuotaGoal(
        item.payload.frequency,
        item.payload.targetMinutes
      ),
    "focusSession.record": (item) =>
      this.focus.recordFocusSession(item.payload),
    "focusTimer.saveState": (item) =>
      this.focus.savePersistedFocusTimerState(item.payload),
    "habit.archive": (item) => this.today.archiveHabit(item.payload.habitId),
    "habit.create": (item) =>
      this.today.createHabit(
        item.payload.name,
        item.payload.category,
        item.payload.frequency,
        item.payload.selectedWeekdays,
        item.payload.targetCount
      ),
    "habit.decrementProgress": (item) =>
      this.today.decrementHabitProgress(item.payload.habitId),
    "habit.incrementProgress": (item) =>
      this.today.incrementHabitProgress(item.payload.habitId),
    "habit.pause": (item) => this.today.pauseHabit(item.payload.habitId),
    "habit.rename": (item) =>
      this.today.renameHabit(item.payload.habitId, item.payload.name),
    "habit.reorder": (item) => this.today.reorderHabits(item.payload.habitIds),
    "habit.resume": (item) => this.today.resumeHabit(item.payload.habitId),
    "habit.toggle": (item) => this.today.toggleHabit(item.payload.habitId),
    "habit.unarchive": (item) =>
      this.today.unarchiveHabit(item.payload.habitId),
    "habit.updateCategory": (item) =>
      this.today.updateHabitCategory(
        item.payload.habitId,
        item.payload.category
      ),
    "habit.updateFrequency": (item) =>
      this.today.updateHabitFrequency(
        item.payload.habitId,
        item.payload.frequency,
        item.payload.targetCount
      ),
    "habit.updateTargetCount": (item) =>
      this.today.updateHabitTargetCount(
        item.payload.habitId,
        item.payload.targetCount
      ),
    "habit.updateWeekdays": (item) =>
      this.today.updateHabitWeekdays(
        item.payload.habitId,
        item.payload.selectedWeekdays
      ),
    "settings.update": (item) => this.updateSettings(item.payload),
    "today.moveUnfinishedToTomorrow": () =>
      this.today.moveUnfinishedHabitsToTomorrow(),
    "today.setDayStatus": (item) => this.today.setDayStatus(item.payload.kind),
    "today.toggleCarryover": (item) =>
      this.today.toggleHabitCarryover(
        item.payload.sourceDate,
        item.payload.habitId
      ),
    "today.toggleSickDay": () => this.today.toggleSickDay(),
    "windDown.createAction": (item) =>
      this.today.createWindDownAction(item.payload.name),
    "windDown.deleteAction": (item) =>
      this.today.deleteWindDownAction(item.payload.actionId),
    "windDown.renameAction": (item) =>
      this.today.renameWindDownAction(item.payload.actionId, item.payload.name),
    "windDown.toggleAction": (item) =>
      this.today.toggleWindDownAction(item.payload.actionId),
  };
  execute<K extends AppCommand["type"]>(
    item: { [P in K]: Extract<AppCommand, { type: P }> }[K]
  ): ResultForAppCommandType<K> {
    return this.executeHandlers[item.type](item);
  }
  private readonly readHandlers: QueryHandlers = {
    "focusSession.list": (item) =>
      this.focus.getFocusSessions(item.payload?.limit),
    "focusTimer.getState": () => this.focus.getPersistedFocusTimerState(),
    "habit.list": () => this.today.getHabits(),
    "history.get": (item) => this.history.getHistory(item.payload?.limit),
    "history.getDay": (item) => this.history.getHistoryDay(item.payload.date),
    "history.getYear": (item) =>
      this.history.getHistoryForYear(item.payload.year),
    "history.summary": (item) =>
      this.history.getHistorySummary(item.payload?.limit),
    "history.summaryMonth": (item) =>
      this.history.getHistorySummaryForMonth(
        item.payload.year,
        item.payload.month
      ),
    "history.summaryYear": (item) =>
      this.history.getHistorySummaryForYear(item.payload.year),
    "history.years": () => this.history.getHistoryYears(),
    "insights.dashboard": (item) =>
      this.history.getInsightsDashboard(item.payload?.rangeDays),
    "today.get": () => this.today.getTodayState(),
    "weeklyReview.get": (item) =>
      this.history.getWeeklyReview(item.payload.weekStart),
    "weeklyReview.overview": () => this.history.getWeeklyReviewOverview(),
  };
  read<K extends AppQuery["type"]>(
    item: { [P in K]: Extract<AppQuery, { type: P }> }[K]
  ): ResultForAppQueryType<K> {
    return this.readHandlers[item.type](item);
  }
  getReminderRuntimeState(): ReminderRuntimeState {
    return this.runtime.withInitialized(() =>
      this.runtime.repository.reminderRuntimeState.getState()
    );
  }

  private updateSettings(settings: AppSettings): AppSettings {
    return this.runtime.withInitialized(() => {
      const savedSettings = this.runtime.repository.settings.saveSettings(
        settings,
        this.runtime.clock.timezone()
      );
      this.runtime.todayReadModel.invalidate();
      return savedSettings;
    });
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.runtime.withInitialized(() => {
      this.runtime.repository.reminderRuntimeState.saveState(state);
    });
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return this.runtime.withInitialized(() =>
      this.runtime.repository.windDownRuntimeState.getState()
    );
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    this.runtime.withInitialized(() => {
      this.runtime.repository.windDownRuntimeState.saveState(state);
    });
  }
}
