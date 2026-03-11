import { ListChecks } from "lucide-react";

import { HabitChecklist } from "@/components/habit-checklist";
import { LongerHabitChecklist } from "@/components/longer-habit-checklist";
import { StreakCard } from "@/components/streak-card";
import { TodayHistoryCarousel } from "@/renderer/features/today/today-history-carousel";
import { TodayPopupStack } from "@/renderer/features/today/today-popup-stack";
import { useTodayPopups } from "@/renderer/features/today/use-today-popups";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

interface TodayPageProps {
  history: HistoryDay[];
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

export function TodayPage({ history, state, onToggleHabit }: TodayPageProps) {
  const dailyHabits = state.habits.filter(isDailyHabit);
  const periodicHabits = state.habits.filter((habit) => !isDailyHabit(habit));
  const categoryProgress = getHabitCategoryProgress(dailyHabits);
  const completedCount = dailyHabits.filter((habit) => habit.completed).length;
  const popups = useTodayPopups({ state });

  return (
    <>
      <div className="grid gap-6">
        <section>
          <TodayHistoryCarousel history={history} todayDate={state.date} />
        </section>

        <section>
          <StreakCard
            availableFreezes={state.streak.availableFreezes}
            currentStreak={state.streak.currentStreak}
            categoryProgress={categoryProgress}
            dateLabel={state.date}
          />
        </section>

        <section>
          <HabitChecklist
            icon={ListChecks}
            completedCount={completedCount}
            emptyMessage="No daily habits yet. Add one in Settings to power the rings and streak."
            habits={dailyHabits}
            onToggleHabit={onToggleHabit}
          />
        </section>

        {periodicHabits.length > 0 ? (
          <section>
            <LongerHabitChecklist
              dateKey={state.date}
              habits={periodicHabits}
              onToggleHabit={onToggleHabit}
            />
          </section>
        ) : null}
      </div>

      <TodayPopupStack popups={popups} />
    </>
  );
}
