/**
 * Today tab page.
 *
 * This screen turns today's habit state into the daily flow the user sees:
 * recent history, streak summary, daily checklist, longer-cycle habits, and
 * celebration toasts.
 */
import { ListChecks, Plus } from "lucide-react";
import { memo, useMemo } from "react";

import { CarryoverChecklist } from "@/renderer/features/today/components/carryover-checklist";
import { HabitChecklist } from "@/renderer/features/today/components/habit-checklist";
import { LongerHabitChecklist } from "@/renderer/features/today/components/longer-habit-checklist";
import { TodayCelebrationOverlay } from "@/renderer/features/today/components/today-celebration-overlay";
import { TodayHabitManagerDialog } from "@/renderer/features/today/components/today-habit-manager-dialog";
import { TodayHistoryCarousel } from "@/renderer/features/today/components/today-history-carousel";
import { useTodayCelebration } from "@/renderer/features/today/hooks/use-today-celebration";
import { useTodayKeyboardRows } from "@/renderer/features/today/hooks/use-today-keyboard-rows";
import { useTodayPopups } from "@/renderer/features/today/hooks/use-today-popups";
import { Button } from "@/renderer/shared/components/ui/button";
import type { HabitMutationActions } from "@/renderer/shared/types/habit-actions";
import type { TodayState } from "@/shared/contracts/today-state";
import { isDailyHabit } from "@/shared/domain/habit";
import type { Habit, HabitWithStatus } from "@/shared/domain/habit";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface TodayPageProps extends HabitMutationActions {
  hasLoadedHistorySummary: boolean;
  historySummary: HistorySummaryDay[];
  managedHabits: Habit[];
  onDecrementHabitProgress: (habitId: number) => void;
  onIncrementHabitProgress: (habitId: number) => void;
  onToggleHabitCarryover: (sourceDate: string, habitId: number) => void;
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

function TodayPageComponent({
  hasLoadedHistorySummary,
  historySummary,
  managedHabits,
  onArchiveHabit,
  onCreateHabit,
  onDecrementHabitProgress,
  onIncrementHabitProgress,
  onToggleHabitCarryover,
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
  const { completedCount, dailyHabits, periodicHabits } = useMemo(() => {
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
      completedCount: nextCompletedCount,
      dailyHabits: nextDailyHabits,
      periodicHabits: nextPeriodicHabits,
    };
  }, [state.habits]);
  useTodayPopups({ completedCount, dailyHabits, state });

  const celebration = useTodayCelebration({
    completedCount,
    dailyHabitCount: dailyHabits.length,
    date: state.date,
    streak: state.streak,
  });
  const {
    getRowProps,
    handleIncrementPeriodicHabit,
    handleToggleCarryover,
    handleToggleDailyHabit,
  } = useTodayKeyboardRows({
    dailyHabits,
    onDecrementHabitProgress,
    onIncrementHabitProgress,
    onToggleHabit,
    onToggleHabitCarryover,
    periodicHabits,
    state,
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
                onUpdateHabitTargetCount={onUpdateHabitTargetCount}
                onUpdateHabitWeekdays={onUpdateHabitWeekdays}
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
                onUpdateHabitTargetCount={onUpdateHabitTargetCount}
                onUpdateHabitWeekdays={onUpdateHabitWeekdays}
              />
            }
            habits={dailyHabits}
            isPaused={state.dayStatus !== null}
            getKeyboardRowProps={getRowProps}
            onToggleHabit={handleToggleDailyHabit}
            {...(state.habitStreaks
              ? { habitStreaks: state.habitStreaks }
              : {})}
          />
        </section>

        {state.habitCarryovers && state.habitCarryovers.length > 0 ? (
          <section>
            <CarryoverChecklist
              carryovers={state.habitCarryovers}
              getKeyboardRowProps={getRowProps}
              onToggleCarryover={handleToggleCarryover}
            />
          </section>
        ) : null}

        {periodicHabits.length > 0 ||
        (state.focusQuotaGoals ?? []).length > 0 ? (
          <section>
            <LongerHabitChecklist
              dateKey={state.date}
              focusQuotaGoals={state.focusQuotaGoals ?? []}
              habits={periodicHabits}
              getKeyboardRowProps={getRowProps}
              onDecrementHabitProgress={onDecrementHabitProgress}
              onIncrementHabitProgress={handleIncrementPeriodicHabit}
            />
          </section>
        ) : null}
      </div>
    </>
  );
}

export const TodayPage = memo(TodayPageComponent);
