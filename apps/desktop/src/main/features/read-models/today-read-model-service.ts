import type { Clock } from "@/main/app/clock";
import {
  buildTodayHabitStreaks,
  buildTodayState,
} from "@/main/features/today/state-builder";
import type { AppRepository } from "@/main/infra/persistence/app-repository";
import type { HabitStatusPatch } from "@/shared/contracts/habit-status-patch";
import type { TodayState } from "@/shared/contracts/today-state";
import type { HabitStreak } from "@/shared/domain/habit-streak";

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
  private readonly repository: AppRepository;

  constructor(repository: AppRepository, clock: Clock) {
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

  getHabitStreaks(): Record<number, HabitStreak> {
    return traceReadModel("today.habitStreaks", () =>
      buildTodayHabitStreaks(this.repository, this.clock)
    );
  }

  invalidate(): void {
    this.cachedTodayState = null;
  }

  patchHabit(habitId: number): HabitStatusPatch {
    const today = this.clock.todayKey();
    const habit = this.repository.getHabitWithStatus(today, habitId);

    if (!habit) {
      this.invalidate();
      throw new Error(`Habit ${habitId} is not scheduled for today.`);
    }

    if (this.cachedTodayState?.date === today) {
      const { habitStreaks: _habitStreaks, ...todayStateWithoutStreaks } =
        this.cachedTodayState;
      this.cachedTodayState = {
        ...todayStateWithoutStreaks,
        habits: this.cachedTodayState.habits.map((candidate) =>
          candidate.id === habitId ? habit : candidate
        ),
      };
    }

    return {
      habit,
      habitStreaksStale: true,
    };
  }
}
