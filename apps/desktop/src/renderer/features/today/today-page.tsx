/**
 * Today tab page.
 *
 * This screen turns today's habit state into the daily flow the user sees:
 * recent history, streak summary, daily checklist, longer-cycle habits, and
 * celebration toasts.
 */
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ListChecks, Plus } from "lucide-react";
import { memo, useMemo } from "react";

import { HabitChecklist } from "@/renderer/features/today/components/habit-checklist";
import { LongerHabitChecklist } from "@/renderer/features/today/components/longer-habit-checklist";
import { StreakCard } from "@/renderer/features/today/components/streak-card";
import { TodayHabitManagerDialog } from "@/renderer/features/today/components/today-habit-manager-dialog";
import { TodayHistoryCarousel } from "@/renderer/features/today/components/today-history-carousel";
import { useTodayCelebration } from "@/renderer/features/today/hooks/use-today-celebration";
import { useTodayPopups } from "@/renderer/features/today/hooks/use-today-popups";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import { Button } from "@/renderer/shared/ui/button";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";

interface TodayPageProps {
  history: HistoryDay[];
  managedHabits: Habit[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: Habit[]) => Promise<void>;
  onUnarchiveHabit: (habitId: number) => Promise<void>;
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
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<void>;
}

function TodayPageComponent({
  history,
  managedHabits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUnarchiveHabit,
  state,
  onToggleHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitWeekdays,
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
  useTodayPopups({ state });
  const celebration = useTodayCelebration({
    completedCount,
    dailyHabitCount: dailyHabits.length,
    state,
  });

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className="grid min-w-0 gap-6"
        initial="initial"
        variants={staggerContainerVariants}
      >
        <m.section className="min-w-0" variants={staggerItemVariants}>
          <TodayHistoryCarousel history={history} todayDate={state.date} />
        </m.section>

        <m.section variants={staggerItemVariants}>
          <StreakCard
            availableFreezes={state.streak.availableFreezes}
            celebration={celebration}
            categoryProgress={categoryProgress}
            currentStreak={state.streak.currentStreak}
            dateLabel={state.date}
            focusMinutes={state.focusMinutes}
          />
        </m.section>

        <m.section variants={staggerItemVariants}>
          <HabitChecklist
            icon={ListChecks}
            completedCount={completedCount}
            emptyMessage="No daily habits yet. Create one to start building momentum."
            emptyAction={
              <TodayHabitManagerDialog
                habits={managedHabits}
                onArchiveHabit={onArchiveHabit}
                onCreateHabit={onCreateHabit}
                onRenameHabit={onRenameHabit}
                onReorderHabits={onReorderHabits}
                onUnarchiveHabit={onUnarchiveHabit}
                onUpdateHabitCategory={onUpdateHabitCategory}
                onUpdateHabitFrequency={onUpdateHabitFrequency}
                onUpdateHabitWeekdays={onUpdateHabitWeekdays}
                trigger={
                  <Button
                    className="rounded-full"
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus className="size-4" />
                    Create your first habit
                  </Button>
                }
              />
            }
            headerActions={
              <TodayHabitManagerDialog
                habits={managedHabits}
                onArchiveHabit={onArchiveHabit}
                onCreateHabit={onCreateHabit}
                onRenameHabit={onRenameHabit}
                onReorderHabits={onReorderHabits}
                onUnarchiveHabit={onUnarchiveHabit}
                onUpdateHabitCategory={onUpdateHabitCategory}
                onUpdateHabitFrequency={onUpdateHabitFrequency}
                onUpdateHabitWeekdays={onUpdateHabitWeekdays}
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
    </LazyMotion>
  );
}

export const TodayPage = memo(TodayPageComponent);
