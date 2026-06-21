/**
 * Core application service for user-facing app operations.
 *
 * Implements the {@link ApplicationService} interface — the single entry point the
 * IPC layer calls for every user-facing operation. Each method runs inside a
 * SQLite transaction, synchronizes rolling streak state on read paths, and
 * returns fresh `TodayState` snapshots so the renderer stays in sync.
 *
 * @see syncRollingState for the streak catch-up logic.
 * @see buildTodayState for how the read-model is assembled.
 */
import type { AppRepository } from "@/main/infra/persistence/sqlite-app-repository";
import type {
  ApplicationService,
  AppSettings,
  CreateFocusSessionInput,
  DayStatusKind,
  FocusSession,
  GoalFrequency,
  Habit,
  HabitCategory,
  AppCommand,
  AppCommandResult,
  HabitFrequency,
  AppQuery,
  AppQueryResult,
  HabitStatusPatch,
  HabitWeekday,
  HistoryDay,
  HistorySummaryDay,
  InsightsDashboard,
  InsightsRangeDays,
  PersistedFocusTimerState,
  ReminderRuntimeState,
  TodayState,
  WeeklyReview,
  WeeklyReviewOverview,
  WindDownRuntimeState,
} from "@/main/ports/application-service";
import type { Clock } from "@/shared/domain/clock";

import { ApplicationServiceRuntime } from "./application-service-runtime";
import { FocusApplicationService } from "./focus-application-service";
import { HistoryReadService } from "./history-read-service";
import { RuntimeSettingsService } from "./runtime-settings-service";
import { TodayCommandService } from "./today-command-service";

export class AppApplicationService implements ApplicationService {
  private readonly runtime: ApplicationServiceRuntime;
  private readonly today: TodayCommandService;
  private readonly focus: FocusApplicationService;
  private readonly history: HistoryReadService;
  private readonly runtimeSettings: RuntimeSettingsService;

  constructor(repository: AppRepository, clock: Clock) {
    this.runtime = new ApplicationServiceRuntime(repository, clock);
    this.today = new TodayCommandService(this.runtime);
    this.focus = new FocusApplicationService(this.runtime);
    this.history = new HistoryReadService(this.runtime);
    this.runtimeSettings = new RuntimeSettingsService(this.runtime);
  }

  initialize(): void {
    this.runtime.initialize();
  }

  execute(command: AppCommand): AppCommandResult {
    if (command.type.startsWith("habit.")) {
      return this.executeHabitCommand(
        command as Extract<AppCommand, { type: `habit.${string}` }>
      );
    }

    if (command.type.startsWith("windDown.")) {
      return this.executeWindDownCommand(
        command as Extract<AppCommand, { type: `windDown.${string}` }>
      );
    }

    switch (command.type) {
      case "focusQuotaGoal.archive": {
        return this.archiveFocusQuotaGoal(command.payload.goalId);
      }
      case "focusQuotaGoal.unarchive": {
        return this.unarchiveFocusQuotaGoal(command.payload.goalId);
      }
      case "focusQuotaGoal.upsert": {
        return this.upsertFocusQuotaGoal(
          command.payload.frequency,
          command.payload.targetMinutes
        );
      }
      case "focusSession.record": {
        return this.recordFocusSession(command.payload);
      }
      case "focusTimer.saveState": {
        return this.savePersistedFocusTimerState(command.payload);
      }
      case "settings.update": {
        return this.updateSettings(command.payload);
      }
      case "today.moveUnfinishedToTomorrow": {
        return this.moveUnfinishedHabitsToTomorrow();
      }
      case "today.setDayStatus": {
        return this.setDayStatus(command.payload.kind);
      }
      case "today.toggleCarryover": {
        return this.toggleHabitCarryover(
          command.payload.sourceDate,
          command.payload.habitId
        );
      }
      case "today.toggleSickDay": {
        return this.toggleSickDay();
      }
      default: {
        throw new Error("Unknown app command.");
      }
    }
  }

  private executeHabitCommand(
    command: Extract<AppCommand, { type: `habit.${string}` }>
  ): AppCommandResult {
    switch (command.type) {
      case "habit.archive": {
        return this.archiveHabit(command.payload.habitId);
      }
      case "habit.create": {
        return this.createHabit(
          command.payload.name,
          command.payload.category,
          command.payload.frequency,
          command.payload.selectedWeekdays,
          command.payload.targetCount
        );
      }
      case "habit.decrementProgress": {
        return this.decrementHabitProgress(command.payload.habitId);
      }
      case "habit.incrementProgress": {
        return this.incrementHabitProgress(command.payload.habitId);
      }
      case "habit.pause": {
        return this.pauseHabit(command.payload.habitId);
      }
      case "habit.rename": {
        return this.renameHabit(command.payload.habitId, command.payload.name);
      }
      case "habit.reorder": {
        return this.reorderHabits(command.payload.habitIds);
      }
      case "habit.resume": {
        return this.resumeHabit(command.payload.habitId);
      }
      case "habit.toggle": {
        return this.toggleHabit(command.payload.habitId);
      }
      case "habit.unarchive": {
        return this.unarchiveHabit(command.payload.habitId);
      }
      case "habit.updateCategory": {
        return this.updateHabitCategory(
          command.payload.habitId,
          command.payload.category
        );
      }
      case "habit.updateFrequency": {
        return this.updateHabitFrequency(
          command.payload.habitId,
          command.payload.frequency,
          command.payload.targetCount
        );
      }
      case "habit.updateTargetCount": {
        return this.updateHabitTargetCount(
          command.payload.habitId,
          command.payload.targetCount
        );
      }
      case "habit.updateWeekdays": {
        return this.updateHabitWeekdays(
          command.payload.habitId,
          command.payload.selectedWeekdays
        );
      }
      default: {
        command satisfies never;
        throw new Error("Unknown habit command.");
      }
    }
  }

  private executeWindDownCommand(
    command: Extract<AppCommand, { type: `windDown.${string}` }>
  ): AppCommandResult {
    switch (command.type) {
      case "windDown.createAction": {
        return this.createWindDownAction(command.payload.name);
      }
      case "windDown.deleteAction": {
        return this.deleteWindDownAction(command.payload.actionId);
      }
      case "windDown.renameAction": {
        return this.renameWindDownAction(
          command.payload.actionId,
          command.payload.name
        );
      }
      case "windDown.toggleAction": {
        return this.toggleWindDownAction(command.payload.actionId);
      }
      default: {
        command satisfies never;
        throw new Error("Unknown wind-down command.");
      }
    }
  }

  read(query: AppQuery): AppQueryResult {
    switch (query.type) {
      case "focusSession.list": {
        return this.getFocusSessions(query.payload?.limit);
      }
      case "focusTimer.getState": {
        return this.getPersistedFocusTimerState();
      }
      case "habit.list": {
        return this.getHabits();
      }
      case "history.get": {
        return this.getHistory(query.payload?.limit);
      }
      case "history.getDay": {
        return this.getHistoryDay(query.payload.date);
      }
      case "history.getYear": {
        return this.getHistoryForYear(query.payload.year);
      }
      case "history.summary": {
        return this.getHistorySummary(query.payload?.limit);
      }
      case "history.summaryMonth": {
        return this.getHistorySummaryForMonth(
          query.payload.year,
          query.payload.month
        );
      }
      case "history.summaryYear": {
        return this.getHistorySummaryForYear(query.payload.year);
      }
      case "history.years": {
        return this.getHistoryYears();
      }
      case "insights.dashboard": {
        return this.getInsightsDashboard(query.payload?.rangeDays);
      }
      case "today.get": {
        return this.getTodayState();
      }
      case "weeklyReview.get": {
        return this.getWeeklyReview(query.payload.weekStart);
      }
      case "weeklyReview.overview": {
        return this.getWeeklyReviewOverview();
      }
      default: {
        query satisfies never;
        throw new Error("Unknown app query.");
      }
    }
  }

  getHabits(): Habit[] {
    return this.today.getHabits();
  }

  getTodayState(): TodayState {
    return this.today.getTodayState();
  }

  setDayStatus(kind: DayStatusKind | null): TodayState {
    return this.today.setDayStatus(kind);
  }

  moveUnfinishedHabitsToTomorrow(): TodayState {
    return this.today.moveUnfinishedHabitsToTomorrow();
  }

  toggleHabitCarryover(sourceDate: string, habitId: number): TodayState {
    return this.today.toggleHabitCarryover(sourceDate, habitId);
  }

  toggleSickDay(): TodayState {
    return this.today.toggleSickDay();
  }

  toggleHabit(habitId: number): HabitStatusPatch {
    return this.today.toggleHabit(habitId);
  }

  incrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.today.incrementHabitProgress(habitId);
  }

  decrementHabitProgress(habitId: number): HabitStatusPatch {
    return this.today.decrementHabitProgress(habitId);
  }

  pauseHabit(habitId: number): TodayState {
    return this.today.pauseHabit(habitId);
  }

  resumeHabit(habitId: number): TodayState {
    return this.today.resumeHabit(habitId);
  }

  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays: HabitWeekday[] | null = null,
    targetCount: number | null = null
  ): TodayState {
    return this.today.createHabit(
      name,
      category,
      frequency,
      selectedWeekdays,
      targetCount
    );
  }

  renameHabit(habitId: number, name: string): TodayState {
    return this.today.renameHabit(habitId, name);
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    return this.today.updateHabitCategory(habitId, category);
  }

  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null = null
  ): TodayState {
    return this.today.updateHabitFrequency(habitId, frequency, targetCount);
  }

  updateHabitTargetCount(habitId: number, targetCount: number): TodayState {
    return this.today.updateHabitTargetCount(habitId, targetCount);
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState {
    return this.today.updateHabitWeekdays(habitId, selectedWeekdays);
  }

  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number
  ): TodayState {
    return this.today.upsertFocusQuotaGoal(frequency, targetMinutes);
  }

  archiveFocusQuotaGoal(goalId: number): TodayState {
    return this.today.archiveFocusQuotaGoal(goalId);
  }

  unarchiveFocusQuotaGoal(goalId: number): TodayState {
    return this.today.unarchiveFocusQuotaGoal(goalId);
  }

  archiveHabit(habitId: number): TodayState {
    return this.today.archiveHabit(habitId);
  }

  unarchiveHabit(habitId: number): TodayState {
    return this.today.unarchiveHabit(habitId);
  }

  reorderHabits(habitIds: number[]): TodayState {
    return this.today.reorderHabits(habitIds);
  }

  createWindDownAction(name: string): TodayState {
    return this.today.createWindDownAction(name);
  }

  renameWindDownAction(actionId: number, name: string): TodayState {
    return this.today.renameWindDownAction(actionId, name);
  }

  deleteWindDownAction(actionId: number): TodayState {
    return this.today.deleteWindDownAction(actionId);
  }

  toggleWindDownAction(actionId: number): TodayState {
    return this.today.toggleWindDownAction(actionId);
  }

  getFocusSessions(limit?: number): FocusSession[] {
    return this.focus.getFocusSessions(limit);
  }

  recordFocusSession(input: CreateFocusSessionInput): FocusSession {
    return this.focus.recordFocusSession(input);
  }

  getPersistedFocusTimerState(): PersistedFocusTimerState | null {
    return this.focus.getPersistedFocusTimerState();
  }

  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState {
    return this.focus.savePersistedFocusTimerState(state);
  }

  getHistory(limit?: number): HistoryDay[] {
    return this.history.getHistory(limit);
  }

  getHistoryYears(): number[] {
    return this.history.getHistoryYears();
  }

  getHistoryForYear(year: number): HistoryDay[] {
    return this.history.getHistoryForYear(year);
  }

  getHistorySummaryForYear(year: number): HistorySummaryDay[] {
    return this.history.getHistorySummaryForYear(year);
  }

  getHistorySummaryForMonth(year: number, month: number): HistorySummaryDay[] {
    return this.history.getHistorySummaryForMonth(year, month);
  }

  getHistoryDay(date: string): HistoryDay {
    return this.history.getHistoryDay(date);
  }

  getHistorySummary(limit?: number): HistorySummaryDay[] {
    return this.history.getHistorySummary(limit);
  }

  getWeeklyReviewOverview(): WeeklyReviewOverview {
    return this.history.getWeeklyReviewOverview();
  }

  getWeeklyReview(weekStart: string): WeeklyReview {
    return this.history.getWeeklyReview(weekStart);
  }

  getInsightsDashboard(rangeDays?: InsightsRangeDays): InsightsDashboard {
    return this.history.getInsightsDashboard(rangeDays);
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    return this.runtimeSettings.getReminderRuntimeState();
  }

  updateSettings(settings: AppSettings): AppSettings {
    return this.runtimeSettings.updateSettings(settings);
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    return this.runtimeSettings.saveReminderRuntimeState(state);
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return this.runtimeSettings.getWindDownRuntimeState();
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    return this.runtimeSettings.saveWindDownRuntimeState(state);
  }
}
