import { HabitChecklist } from "@/components/habit-checklist";
import { StreakCard } from "@/components/streak-card";
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import type { TodayState } from "@/shared/types/ipc";


interface TodayPageProps {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const categoryProgress = getHabitCategoryProgress(state.habits);
  const completedCount = state.habits.filter((habit) => habit.completed).length;

  return (
    <div className="grid gap-6">
      <StreakCard
        availableFreezes={state.streak.availableFreezes}
        currentStreak={state.streak.currentStreak}
        categoryProgress={categoryProgress}
        dateLabel={state.date}
      />

      <HabitChecklist
        completedCount={completedCount}
        habits={state.habits}
        onToggleHabit={onToggleHabit}
      />
    </div>
  );
}
