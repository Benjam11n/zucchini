import type { TodayState } from "@/shared/contracts/habits-ipc";
import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
} from "@/shared/domain/habit";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import type { AppSettings } from "@/shared/domain/settings";

import type { Clock } from "../clock";
import type { ReminderRuntimeState } from "../reminder-runtime-state";
import type { HabitRepository } from "../repository";
import { syncRollingState } from "./streak-sync-service";
import {
  buildHistoryDay,
  buildTodayPreviewSummary,
  buildTodayState,
} from "./today-state-builder";

export interface HabitsService {
  initialize(): void;
  getTodayState(): TodayState;
  toggleHabit(habitId: number): TodayState;
  getHistory(): HistoryDay[];
  getReminderRuntimeState(): ReminderRuntimeState;
  updateSettings(settings: AppSettings): AppSettings;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
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

  getTodayState(): TodayState {
    this.syncRollingState();
    return buildTodayState(this.repository, this.clock);
  }

  toggleHabit(habitId: number): TodayState {
    const today = this.clock.todayKey();
    this.syncRollingState();
    this.repository.ensureStatusRowsForDate(today);
    this.repository.toggleHabit(today, habitId);
    return buildTodayState(this.repository, this.clock);
  }

  getHistory(): HistoryDay[] {
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

  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ): TodayState {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return this.getTodayState();
    }

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
    this.repository.updateHabitFrequency(
      habitId,
      normalizeHabitFrequency(frequency)
    );
    this.repository.ensureStatusRow(this.clock.todayKey(), habitId);
    return buildTodayState(this.repository, this.clock);
  }

  archiveHabit(habitId: number): TodayState {
    this.repository.archiveHabit(habitId);
    this.repository.normalizeHabitOrder();
    this.syncRollingState();
    return buildTodayState(this.repository, this.clock);
  }

  reorderHabits(habitIds: number[]): TodayState {
    const activeHabits = this.repository.getHabits();
    if (habitIds.length !== activeHabits.length) {
      return buildTodayState(this.repository, this.clock);
    }

    this.repository.reorderHabits(habitIds);
    return buildTodayState(this.repository, this.clock);
  }

  private syncRollingState(): void {
    syncRollingState(this.repository, this.clock);
  }
}
