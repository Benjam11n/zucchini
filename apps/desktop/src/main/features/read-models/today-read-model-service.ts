import { buildTodayState } from "@/main/features/today/state-builder";
import type { TodayReadModelRepositoryPort } from "@/main/ports/app-repository";
import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { TodayState } from "@/shared/contracts/today-state";
import type { Clock } from "@/shared/domain/clock";

const DEBUG_READ_MODELS =
  typeof process !== "undefined" &&
  process.env["ZUCCHINI_DEBUG_READ_MODELS"] === "1";

function traceReadModel<T>(label: string, execute: () => T): T {
  if (!DEBUG_READ_MODELS) {
    return execute();
  }

  const startedAt = performance.now();
  try {
    return execute();
  } finally {
    console.debug(
      `[read-model] ${label} ${(performance.now() - startedAt).toFixed(1)}ms`
    );
  }
}

export class TodayReadModelService {
  private cachedTodayState: TodayState | null = null;
  private readonly clock: Clock;
  private readonly repository: TodayReadModelRepositoryPort;

  constructor(repository: TodayReadModelRepositoryPort, clock: Clock) {
    this.clock = clock;
    this.repository = repository;
  }

  getTodayState(): TodayState {
    const today = this.clock.todayKey();

    if (this.cachedTodayState?.date === today) {
      return this.cachedTodayState;
    }

    this.cachedTodayState = traceReadModel("today.build", () =>
      buildTodayState(this.repository, this.clock)
    );
    return this.cachedTodayState;
  }

  invalidate(): void {
    this.cachedTodayState = null;
  }

  getFreshHabitStatusPatch(habitId: number): HabitStatusPatch {
    const today = this.clock.todayKey();
    const habit = this.repository.getHabitWithStatus(today, habitId);

    if (!habit) {
      this.invalidate();
      throw new Error(`Habit ${habitId} is not scheduled for today.`);
    }

    this.invalidate();

    return {
      habit,
      habitStreaksStale: true,
    };
  }
}
