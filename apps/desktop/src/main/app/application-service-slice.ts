import type { TodayReadModelService } from "@/main/features/read-models/today-read-model-service";
import type { AppRepository } from "@/main/ports/app-repository";
import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { TodayState } from "@/shared/contracts/today-state";
import type { Clock } from "@/shared/domain/clock";

import type { ApplicationServiceRuntime } from "./application-service-runtime";

export abstract class ApplicationServiceSlice {
  protected readonly runtime: ApplicationServiceRuntime;

  constructor(runtime: ApplicationServiceRuntime) {
    this.runtime = runtime;
  }

  protected get repository(): AppRepository {
    return this.runtime.repository;
  }

  protected get clock(): Clock {
    return this.runtime.clock;
  }

  protected get todayReadModel(): TodayReadModelService {
    return this.runtime.todayReadModel;
  }

  protected withInitialized<A>(execute: () => A): A {
    return this.runtime.withInitialized(execute);
  }

  protected inInitializedTransaction<A>(label: string, execute: () => A): A {
    return this.runtime.inInitializedTransaction(label, execute);
  }

  protected withSyncedRead<A>(label: string, execute: () => A): A {
    return this.runtime.withSyncedRead(label, execute);
  }

  protected buildCurrentTodayState(): TodayState {
    return this.runtime.buildCurrentTodayState();
  }

  protected getTodayKey(): string {
    return this.runtime.getTodayKey();
  }

  protected getTimezone(): string {
    return this.runtime.getTimezone();
  }

  protected preserveTodayHabitProgress(
    today: string,
    habitId: number,
    previousProgress: number,
    targetCount: number
  ): void {
    this.runtime.preserveTodayHabitProgress(
      today,
      habitId,
      previousProgress,
      targetCount
    );
  }

  protected rebuildCurrentTodayState(): TodayState {
    return this.runtime.rebuildCurrentTodayState();
  }

  protected mutateTodayState(
    label: string,
    mutate: (today: string) => void,
    options: {
      ensureStatusRowsForToday?: boolean;
      syncRollingState?: boolean;
    } = {}
  ): TodayState {
    return this.runtime.mutateTodayState(label, mutate, options);
  }

  protected mutateHabitStatusPatch(
    label: string,
    habitId: number,
    mutate: (today: string) => void
  ): HabitStatusPatch {
    return this.runtime.mutateHabitStatusPatch(label, habitId, mutate);
  }

  protected syncRollingState(): void {
    this.runtime.syncRollingState();
  }
}
