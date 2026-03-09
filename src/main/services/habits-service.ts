import type { TodayState } from "@/shared/contracts/habits-ipc";
import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
} from "@/shared/domain/habit";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import { cloneStarterPackHabits } from "@/shared/domain/onboarding";
import type {
  CompleteOnboardingInput,
  OnboardingStatus,
  StarterPackHabitDraft,
} from "@/shared/domain/onboarding";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import {
  endOfIsoWeek,
  getPreviousCompletedIsoWeek,
  startOfIsoWeek,
} from "@/shared/utils/date";

import type { Clock } from "../clock";
import type { ReminderRuntimeState } from "../reminder-runtime-state";
import type { HabitRepository } from "../repository";
import { syncRollingState } from "./streak-sync-service";
import {
  buildHistoryDay,
  buildTodayPreviewSummary,
  buildTodayState,
} from "./today-state-builder";
import {
  buildWeeklyReview,
  buildWeeklyReviewOverview,
} from "./weekly-review-builder";

function normalizeStarterPackHabits(
  habits: readonly StarterPackHabitDraft[]
): StarterPackHabitDraft[] {
  return cloneStarterPackHabits(habits).filter(
    (habit) => habit.name.length > 0
  );
}

export interface HabitsService {
  initialize(): void;
  getOnboardingStatus(): OnboardingStatus;
  getTodayState(): TodayState;
  toggleHabit(habitId: number): TodayState;
  getHistory(): HistoryDay[];
  getWeeklyReviewOverview(): WeeklyReviewOverview;
  getWeeklyReview(weekStart: string): WeeklyReview;
  getReminderRuntimeState(): ReminderRuntimeState;
  updateSettings(settings: AppSettings): AppSettings;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
  completeOnboarding(input: CompleteOnboardingInput): TodayState;
  skipOnboarding(): void;
  applyStarterPack(habits: StarterPackHabitDraft[]): TodayState;
  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ): TodayState;
  renameHabit(habitId: number, name: string): TodayState;
  updateHabitCategory(habitId: number, category: HabitCategory): TodayState;
  updateHabitFrequency(habitId: number, frequency: HabitFrequency): TodayState;
  archiveHabit(habitId: number): TodayState;
  reorderHabits(habitIds: number[]): TodayState;
}

export class HabitService implements HabitsService {
  private readonly repository: HabitRepository;
  private readonly clock: Clock;

  constructor(repository: HabitRepository, clock: Clock) {
    this.repository = repository;
    this.clock = clock;
  }

  initialize(): void {
    this.repository.initializeSchema();
    this.repository.seedDefaults(
      this.clock.now().toISOString(),
      this.clock.timezone()
    );
    this.syncRollingState();
  }

  getOnboardingStatus(): OnboardingStatus {
    return this.repository.runInTransaction("getOnboardingStatus", () =>
      this.repository.getOnboardingStatus()
    );
  }

  getTodayState(): TodayState {
    return this.repository.runInTransaction("getTodayState", () => {
      this.syncRollingState();
      return buildTodayState(this.repository, this.clock);
    });
  }

  toggleHabit(habitId: number): TodayState {
    return this.repository.runInTransaction("toggleHabit", () => {
      const today = this.clock.todayKey();
      this.syncRollingState();
      this.repository.ensureStatusRowsForDate(today);
      this.repository.toggleHabit(today, habitId);
      return buildTodayState(this.repository, this.clock);
    });
  }

  getHistory(): HistoryDay[] {
    return this.repository.runInTransaction("getHistory", () => {
      this.syncRollingState();
      const todayState = buildTodayState(this.repository, this.clock);

      return [
        buildHistoryDay(
          buildTodayPreviewSummary(todayState, this.clock.now().toISOString()),
          this.repository.getHabitsWithStatus(this.clock.todayKey())
        ),
        ...this.repository
          .getSettledHistory()
          .map((summary) =>
            buildHistoryDay(
              summary,
              this.repository.getHistoricalHabitsWithStatus(summary.date)
            )
          ),
      ];
    });
  }

  getWeeklyReviewOverview(): WeeklyReviewOverview {
    return this.repository.runInTransaction("getWeeklyReviewOverview", () => {
      this.syncRollingState();
      const firstTrackedDate = this.repository.getFirstTrackedDate();
      const latestTrackedDate = this.repository.getLatestTrackedDate();

      if (!firstTrackedDate || !latestTrackedDate) {
        return {
          availableWeeks: [],
          latestReview: null,
          trend: [],
        };
      }

      const latestCompletedWeek = getPreviousCompletedIsoWeek(
        this.clock.todayKey()
      );
      if (latestTrackedDate < latestCompletedWeek.weekStart) {
        return {
          availableWeeks: [],
          latestReview: null,
          trend: [],
        };
      }

      const rangeStart = startOfIsoWeek(firstTrackedDate);
      const rangeEnd = latestCompletedWeek.weekEnd;

      return buildWeeklyReviewOverview({
        dailySummaries: this.repository.getDailySummariesInRange(
          rangeStart,
          rangeEnd
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          rangeStart,
          rangeEnd
        ),
      });
    });
  }

  getWeeklyReview(weekStart: string): WeeklyReview {
    return this.repository.runInTransaction("getWeeklyReview", () => {
      this.syncRollingState();
      const normalizedWeekStart = startOfIsoWeek(weekStart);
      const weekEnd = endOfIsoWeek(normalizedWeekStart);

      return buildWeeklyReview({
        dailySummaries: this.repository.getDailySummariesInRange(
          normalizedWeekStart,
          weekEnd
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          normalizedWeekStart,
          weekEnd
        ),
        weekStart: normalizedWeekStart,
      });
    });
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    return this.repository.getReminderRuntimeState();
  }

  updateSettings(settings: AppSettings): AppSettings {
    return this.repository.saveSettings(settings, this.clock.timezone());
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.repository.saveReminderRuntimeState(state);
  }

  completeOnboarding(input: CompleteOnboardingInput): TodayState {
    return this.repository.runInTransaction("completeOnboarding", () => {
      this.syncRollingState();
      const settings = this.repository.saveSettings(
        input.settings,
        this.clock.timezone()
      );
      const normalizedHabits = normalizeStarterPackHabits(input.habits);
      const nowIso = this.clock.now().toISOString();

      if (normalizedHabits.length > 0) {
        this.repository.appendHabits(
          normalizedHabits,
          nowIso,
          this.clock.todayKey()
        );
      }

      this.repository.markOnboardingComplete(nowIso);
      const todayState = buildTodayState(this.repository, this.clock);

      return {
        ...todayState,
        settings,
      };
    });
  }

  skipOnboarding(): void {
    this.repository.runInTransaction("skipOnboarding", () => {
      this.repository.markOnboardingComplete(this.clock.now().toISOString());
    });
  }

  applyStarterPack(habits: StarterPackHabitDraft[]): TodayState {
    return this.repository.runInTransaction("applyStarterPack", () => {
      this.syncRollingState();
      const normalizedHabits = normalizeStarterPackHabits(habits);
      if (normalizedHabits.length > 0) {
        this.repository.appendHabits(
          normalizedHabits,
          this.clock.now().toISOString(),
          this.clock.todayKey()
        );
      }

      return buildTodayState(this.repository, this.clock);
    });
  }

  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    return this.repository.runInTransaction("createHabit", () => {
      const today = this.clock.todayKey();
      this.syncRollingState();
      const habitId = this.repository.insertHabit(
        trimmedName,
        normalizeHabitCategory(category),
        normalizeHabitFrequency(frequency),
        this.repository.getMaxSortOrder() + 1,
        this.clock.now().toISOString()
      );
      this.repository.ensureStatusRow(today, habitId);
      return buildTodayState(this.repository, this.clock);
    });
  }

  renameHabit(habitId: number, name: string): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

    this.repository.renameHabit(habitId, trimmedName);
    return buildTodayState(this.repository, this.clock);
  }

  updateHabitCategory(habitId: number, category: HabitCategory): TodayState {
    this.repository.updateHabitCategory(
      habitId,
      normalizeHabitCategory(category)
    );
    return buildTodayState(this.repository, this.clock);
  }

  updateHabitFrequency(habitId: number, frequency: HabitFrequency): TodayState {
    return this.repository.runInTransaction("updateHabitFrequency", () => {
      this.repository.updateHabitFrequency(
        habitId,
        normalizeHabitFrequency(frequency)
      );
      this.repository.ensureStatusRow(this.clock.todayKey(), habitId);
      return buildTodayState(this.repository, this.clock);
    });
  }

  archiveHabit(habitId: number): TodayState {
    return this.repository.runInTransaction("archiveHabit", () => {
      this.repository.archiveHabit(habitId);
      this.repository.normalizeHabitOrder();
      this.syncRollingState();
      return buildTodayState(this.repository, this.clock);
    });
  }

  reorderHabits(habitIds: number[]): TodayState {
    return this.repository.runInTransaction("reorderHabits", () => {
      const activeHabits = this.repository.getHabits();
      const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));

      if (
        habitIds.length !== activeHabits.length ||
        habitIds.some((habitId) => !activeHabitIds.has(habitId))
      ) {
        return buildTodayState(this.repository, this.clock);
      }

      this.repository.reorderHabits(habitIds);
      return buildTodayState(this.repository, this.clock);
    });
  }

  private syncRollingState(): void {
    syncRollingState(this.repository, this.clock);
  }
}
