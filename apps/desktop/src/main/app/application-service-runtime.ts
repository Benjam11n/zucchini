import { TodayReadModelService } from "@/main/features/read-models/today-read-model-service";
import { syncRollingState } from "@/main/features/streaks/sync-service";
import type { AppRepository } from "@/main/ports/app-repository";
import type { Clock } from "@/shared/domain/clock";
import type { FocusSession } from "@/shared/domain/focus-session";
import { toFocusMinutes } from "@/shared/domain/focus-session";
import type { HabitStatusPatch } from "@/shared/read-models/habit-status-patch";
import type { TodayState } from "@/shared/read-models/today-state";

export class ApplicationServiceRuntime {
  readonly repository: AppRepository;
  readonly clock: Clock;
  readonly todayReadModel: TodayReadModelService;
  private initialized = false;

  constructor(repository: AppRepository, clock: Clock) {
    this.repository = repository;
    this.clock = clock;
    this.todayReadModel = new TodayReadModelService(repository, clock);
  }

  static buildFocusMinutesByDate(
    sessions: FocusSession[]
  ): Map<string, number> {
    const totalSecondsByDate = new Map<string, number>();

    for (const session of sessions) {
      totalSecondsByDate.set(
        session.completedDate,
        (totalSecondsByDate.get(session.completedDate) ?? 0) +
          session.durationSeconds
      );
    }

    return new Map(
      [...totalSecondsByDate.entries()].map(([date, totalSeconds]) => [
        date,
        toFocusMinutes(totalSeconds),
      ])
    );
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.repository.initializeSchema();
    this.repository.seedDefaults(
      this.clock.now().toISOString(),
      this.clock.timezone()
    );
    this.syncRollingState();
    this.initialized = true;
  }

  withInitialized<A>(execute: () => A): A {
    this.initialize();
    return execute();
  }

  inInitializedTransaction<A>(label: string, execute: () => A): A {
    return this.withInitialized(() =>
      this.repository.runInTransaction(label, execute)
    );
  }

  withSyncedRead<A>(label: string, execute: () => A): A {
    return this.inInitializedTransaction(label, () => {
      this.syncRollingState();
      return execute();
    });
  }

  buildCurrentTodayState(): TodayState {
    return this.todayReadModel.getTodayState();
  }

  getTodayKey(): string {
    return this.clock.todayKey();
  }

  getTimezone(): string {
    return this.clock.timezone();
  }

  preserveTodayHabitProgress(
    today: string,
    habitId: number,
    previousProgress: number,
    targetCount: number
  ): void {
    this.repository.ensureStatusRow(today, habitId);
    this.repository.setHabitProgress(
      today,
      habitId,
      Math.min(previousProgress, targetCount)
    );
  }

  rebuildCurrentTodayState(): TodayState {
    this.todayReadModel.invalidate();
    return this.buildCurrentTodayState();
  }

  mutateTodayState(
    label: string,
    mutate: (today: string) => void,
    options: {
      ensureStatusRowsForToday?: boolean;
      syncRollingState?: boolean;
    } = {}
  ): TodayState {
    return this.inInitializedTransaction(label, () => {
      const today = this.getTodayKey();

      if (options.syncRollingState) {
        this.syncRollingState();
      }

      if (options.ensureStatusRowsForToday) {
        this.repository.ensureStatusRowsForDate(today);
      }

      mutate(today);

      return this.rebuildCurrentTodayState();
    });
  }

  mutateHabitStatusPatch(
    label: string,
    habitId: number,
    mutate: (today: string) => void
  ): HabitStatusPatch {
    return this.inInitializedTransaction(label, () => {
      const today = this.getTodayKey();

      this.syncRollingState();
      this.repository.ensureStatusRowsForDate(today);
      mutate(today);

      return this.todayReadModel.getFreshHabitStatusPatch(habitId);
    });
  }

  syncRollingState(): void {
    syncRollingState(this.repository, this.clock);
  }
}
