/**
 * Today tab page.
 *
 * This screen turns today's habit state into the daily flow the user sees:
 * recent history, streak summary, daily checklist, longer-cycle habits, and
 * celebration popups.
 */
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ListChecks } from "lucide-react";
import { memo, useMemo } from "react";

import { HabitChecklist } from "@/renderer/features/today/components/habit-checklist";
import { LongerHabitChecklist } from "@/renderer/features/today/components/longer-habit-checklist";
import { StreakCard } from "@/renderer/features/today/components/streak-card";
import { TodayHistoryCarousel } from "@/renderer/features/today/components/today-history-carousel";
import { TodayPopupStack } from "@/renderer/features/today/components/today-popup-stack";
import { useTodayPopups } from "@/renderer/features/today/hooks/use-today-popups";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

interface TodayPageProps {
  history: HistoryDay[];
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

function TodayPageComponent({ history, state, onToggleHabit }: TodayPageProps) {
  const { categoryProgress, completedCount, dailyHabits, periodicHabits } =
    useMemo(() => {
      const nextDailyHabits: HabitWithStatus[] = [];
      const nextPeriodicHabits: HabitWithStatus[] = [];
      let nextCompletedCount = 0;

      for (const habit of state.habits) {
        if (isDailyHabit(habit)) {
          nextDailyHabits.push(habit);
          if (habit.completed) {
            nextCompletedCount += 1;
          }
          continue;
        }

        nextPeriodicHabits.push(habit);
      }

      return {
        categoryProgress: getHabitCategoryProgress(nextDailyHabits),
        completedCount: nextCompletedCount,
        dailyHabits: nextDailyHabits,
        periodicHabits: nextPeriodicHabits,
      };
    }, [state.habits]);
  const popups = useTodayPopups({ state });

  return (
    <LazyMotion features={domAnimation}>
      <>
        <m.div
          animate="animate"
          className="grid gap-6"
          initial="initial"
          variants={staggerContainerVariants}
        >
          <m.section variants={staggerItemVariants}>
            <TodayHistoryCarousel history={history} todayDate={state.date} />
          </m.section>

          <m.section variants={staggerItemVariants}>
            <StreakCard
              availableFreezes={state.streak.availableFreezes}
              currentStreak={state.streak.currentStreak}
              categoryProgress={categoryProgress}
              dateLabel={state.date}
            />
          </m.section>

          <m.section variants={staggerItemVariants}>
            <HabitChecklist
              icon={ListChecks}
              completedCount={completedCount}
              emptyMessage="No daily habits yet. Add one in Settings to power the rings and streak."
              habits={dailyHabits}
              onToggleHabit={onToggleHabit}
            />
          </m.section>

          {periodicHabits.length > 0 ? (
            <m.section variants={staggerItemVariants}>
              <LongerHabitChecklist
                dateKey={state.date}
                habits={periodicHabits}
                onToggleHabit={onToggleHabit}
              />
            </m.section>
          ) : null}
        </m.div>

        <TodayPopupStack popups={popups} />
      </>
    </LazyMotion>
  );
}

export const TodayPage = memo(TodayPageComponent);
