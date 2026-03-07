import { getProgress } from "../../shared/domain/streak";
import type { TodayState } from "../../shared/types/ipc";
import { HabitChecklist } from "../components/habit-checklist";
import { StreakCard } from "../components/streak-card";

interface TodayPageProps {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const progress = getProgress(
    state.habits.map((habit) => habit.completed),
    state.habits.length
  );
  const completedCount = state.habits.filter((habit) => habit.completed).length;

  return (
    <div className="grid gap-6">
      <StreakCard
        bestStreak={state.streak.bestStreak}
        completedHabits={completedCount}
        currentStreak={state.streak.currentStreak}
        dateLabel={state.date}
        progress={progress}
        totalHabits={state.habits.length}
      />

      <HabitChecklist
        completedCount={completedCount}
        habits={state.habits}
        onToggleHabit={onToggleHabit}
      />
    </div>
  );
}
