/**
 * Today tab page.
 *
 * This screen turns today's habit state into the daily flow the user sees:
 * recent history, streak summary, daily checklist, longer-cycle habits, and
 * celebration toasts.
 */
import { useLiveQuery } from "@tanstack/react-db";
import { ListChecks, Plus } from "lucide-react";
import { memo, useMemo } from "react";

import { HabitChecklist } from "@/renderer/features/today/components/habit-checklist";
import { LongerHabitChecklist } from "@/renderer/features/today/components/longer-habit-checklist";
import { TodayCelebrationOverlay } from "@/renderer/features/today/components/today-celebration-overlay";
import { TodayHabitManagerDialog } from "@/renderer/features/today/components/today-habit-manager-dialog";
import { TodayHistoryCarousel } from "@/renderer/features/today/components/today-history-carousel";
import { useTodayCelebration } from "@/renderer/features/today/hooks/use-today-celebration";
import { useTodayPopups } from "@/renderer/features/today/hooks/use-today-popups";
import { todayHabitCollection } from "@/renderer/features/today/state/today-collections";
import { Button } from "@/renderer/shared/components/ui/button";
import type { TodayState } from "@/shared/contracts/today-state";
import { isDailyHabit } from "@/shared/domain/habit";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface TodayPageProps {
  hasLoadedHistorySummary: boolean;
  historySummary: HistorySummaryDay[];
  managedHabits: Habit[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) => Promise<void>;
  onDecrementHabitProgress?: (habitId: number) => void;
  onIncrementHabitProgress?: (habitId: number) => void;
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
    frequency: HabitFrequency,
    targetCount?: number | null
  ) => Promise<void>;
  onUpdateHabitTargetCount?: (
    habitId: number,
    targetCount: number
  ) => Promise<void>;
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) => Promise<void>;
}

function noopHabitProgress(_habitId: number) {
  return null;
}

function TodayPageComponent({
  hasLoadedHistorySummary,
  historySummary,
  managedHabits,
  onArchiveHabit,
  onCreateHabit,
  onDecrementHabitProgress,
  onIncrementHabitProgress,
  onRenameHabit,
  onReorderHabits,
  onUnarchiveHabit,
  state,
  onToggleHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: TodayPageProps) {
  const { data: liveHabits } = useLiveQuery((query) =>
    query
      .from({ habit: todayHabitCollection })
      .orderBy(({ habit }) => habit.sortOrder, "asc")
  );
  const visibleHabits = liveHabits.length > 0 ? liveHabits : state.habits;
  const { completedCount, dailyHabits, periodicHabits } = useMemo(() => {
    const nextDailyHabits: HabitWithStatus[] = [];
    const nextPeriodicHabits: HabitWithStatus[] = [];
    let nextCompletedCount = 0;

    for (const habit of visibleHabits) {
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
      completedCount: nextCompletedCount,
      dailyHabits: nextDailyHabits,
      periodicHabits: nextPeriodicHabits,
    };
  }, [visibleHabits]);
  useTodayPopups({ completedCount, dailyHabits, state });

  const celebration = useTodayCelebration({
    completedCount,
    dailyHabitCount: dailyHabits.length,
    date: state.date,
    streak: state.streak,
  });

  return (
    <>
      <TodayCelebrationOverlay celebration={celebration} />

      <div className="grid w-full min-w-0 max-w-full gap-6">
        <section className="min-w-0">
          <TodayHistoryCarousel
            hasLoadedHistorySummary={hasLoadedHistorySummary}
            history={historySummary}
            todayDate={state.date}
          />
        </section>

        <section>
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
                {...(onUpdateHabitTargetCount
                  ? { onUpdateHabitTargetCount }
                  : {})}
                trigger={
                  <Button size="sm" type="button" variant="outline">
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
                {...(onUpdateHabitTargetCount
                  ? { onUpdateHabitTargetCount }
                  : {})}
              />
            }
            habits={dailyHabits}
            onToggleHabit={onToggleHabit}
            {...(state.habitStreaks
              ? { habitStreaks: state.habitStreaks }
              : {})}
          />
        </section>

        {periodicHabits.length > 0 ||
        (state.focusQuotaGoals ?? []).length > 0 ? (
          <section>
            <LongerHabitChecklist
              dateKey={state.date}
              focusQuotaGoals={state.focusQuotaGoals ?? []}
              habits={periodicHabits}
              onDecrementHabitProgress={
                onDecrementHabitProgress ?? noopHabitProgress
              }
              onIncrementHabitProgress={
                onIncrementHabitProgress ?? noopHabitProgress
              }
            />
          </section>
        ) : null}
      </div>
    </>
  );
}

export const TodayPage = memo(TodayPageComponent);
