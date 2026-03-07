import { FreezeCard } from "../components/FreezeCard";
import { HabitChecklist } from "../components/HabitChecklist";
import { ProgressRing } from "../components/ProgressRing";
import { StreakCard } from "../components/StreakCard";
import { getProgress } from "../../shared/domain/streak";
import type { TodayState } from "../../shared/types/ipc";

type TodayPageProps = {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
};

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const progress = getProgress(
    state.habits.map((habit) => habit.completed),
    state.habits.length,
  );

  return (
    <div className="page">
      <header className="hero panel">
        <div>
          <p className="eyebrow">Today</p>
          <h2>{state.date}</h2>
          <p className="hero-copy">
            Complete every habit before the day ends to keep the streak alive.
          </p>
        </div>
      </header>

      <section className="metrics-grid">
        <StreakCard
          bestStreak={state.streak.bestStreak}
          currentStreak={state.streak.currentStreak}
        />
        <FreezeCard availableFreezes={state.streak.availableFreezes} />
        <ProgressRing progress={progress} />
      </section>

      <HabitChecklist habits={state.habits} onToggleHabit={onToggleHabit} />
    </div>
  );
}
