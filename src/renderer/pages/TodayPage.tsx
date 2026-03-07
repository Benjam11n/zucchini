import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getProgress } from "../../shared/domain/streak";
import type { TodayState } from "../../shared/types/ipc";
import { FreezeCard } from "../components/FreezeCard";
import { HabitChecklist } from "../components/HabitChecklist";
import { ProgressRing } from "../components/ProgressRing";
import { StreakCard } from "../components/StreakCard";

interface TodayPageProps {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const progress = getProgress(
    state.habits.map((habit) => habit.completed),
    state.habits.length
  );

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="gap-3">
          <CardDescription>Today</CardDescription>
          <CardTitle>{state.date}</CardTitle>
          <CardDescription>
            Complete every habit before the day ends to keep the streak alive.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 xl:grid-cols-3">
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
