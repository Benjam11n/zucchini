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
import { TodayHabitManagerDialog } from "@/renderer/features/today/components/today-habit-manager-dialog";
import { TodayHistoryCarousel } from "@/renderer/features/today/components/today-history-carousel";
import { TodayPopupStack } from "@/renderer/features/today/components/today-popup-stack";
import { useTodayPopups } from "@/renderer/features/today/hooks/use-today-popups";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

interface TodayPageProps {
  history: HistoryDay[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
  ) => Promise<void>;
}

function TodayPageComponent({
  history,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  state,
  onToggleHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
}: TodayPageProps) {
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
              headerActions={
                <TodayHabitManagerDialog
                  habits={state.habits}
                  onArchiveHabit={onArchiveHabit}
                  onCreateHabit={onCreateHabit}
                  onRenameHabit={onRenameHabit}
                  onReorderHabits={onReorderHabits}
                  onUpdateHabitCategory={onUpdateHabitCategory}
                  onUpdateHabitFrequency={onUpdateHabitFrequency}
                />
              }
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
