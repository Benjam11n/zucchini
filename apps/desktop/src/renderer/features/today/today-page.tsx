/**
 * Today tab page.
 *
 * This screen turns today's habit state into the daily flow the user sees:
 * recent history, streak summary, daily checklist, periodic habits, and
 * celebration toasts.
 */
import { ListChecks, Plus } from "lucide-react";
import { memo, useMemo } from "react";

import { CarryoverChecklist } from "@/renderer/features/today/components/carryover-checklist";
import { HabitChecklist } from "@/renderer/features/today/components/habit-checklist";
import { HistoricalTodayView } from "@/renderer/features/today/components/historical-today-view";
import { PeriodicHabitChecklist } from "@/renderer/features/today/components/periodic-habit-checklist";
import { TodayCelebrationOverlay } from "@/renderer/features/today/components/today-celebration-overlay";
import { TodayHabitManagerDialog } from "@/renderer/features/today/components/today-habit-manager-dialog";
import { TodayHistoryCarousel } from "@/renderer/features/today/components/today-history-carousel";
import { TodayKeyboardHint } from "@/renderer/features/today/components/today-keyboard-hint";
import { useHistoricalTodaySelection } from "@/renderer/features/today/hooks/use-historical-today-selection";
import { useTodayCelebration } from "@/renderer/features/today/hooks/use-today-celebration";
import { useTodayKeyboardRows } from "@/renderer/features/today/hooks/use-today-keyboard-rows";
import { useTodayPopups } from "@/renderer/features/today/hooks/use-today-popups";
import { splitTodayHabits } from "@/renderer/features/today/lib/split-today-habits";
import type { TodayPageActions } from "@/renderer/features/today/today.types";
import { Button } from "@/renderer/shared/components/ui/button";
import type { Habit } from "@/shared/domain/habit";
import { isHabitPaused } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type { TodayState } from "@/shared/read-models/today-state";

const noopHabitMutation = () => Promise.resolve();

interface TodayPageViewModel {
  hasLoadedHistorySummary: boolean;
  historyDayByDate: Record<string, HistoryDay | undefined>;
  historySummary: HistorySummaryDay[];
  isHistoryDayLoading: boolean;
  loadingHistoryDayKey: string | null;
  managedHabits: Habit[];
  state: TodayState;
}

interface TodayPageProps {
  actions: TodayPageActions;
  viewModel: TodayPageViewModel;
}

export const TodayPage = memo(function TodayPage({
  actions,
  viewModel,
}: TodayPageProps) {
  const {
    hasLoadedHistorySummary,
    historyDayByDate,
    historySummary,
    isHistoryDayLoading,
    loadingHistoryDayKey,
    managedHabits,
    state,
  } = viewModel;
  const habitManagementActions = actions.habits;
  const resumeHabit = habitManagementActions.resumeHabit ?? noopHabitMutation;
  const { completedDailyHabitCount, dailyHabits, periodicHabits } = useMemo(
    () => splitTodayHabits(state.habits),
    [state.habits]
  );
  const carryoversComplete = (state.habitCarryovers ?? []).every(
    (carryover) => carryover.completed
  );
  const streakEligibleCompletedCount = carryoversComplete
    ? completedDailyHabitCount
    : Math.min(completedDailyHabitCount, Math.max(dailyHabits.length - 1, 0));
  const pausedHabits = useMemo(
    () => managedHabits.filter(isHabitPaused),
    [managedHabits]
  );
  const historicalHistorySummary = useMemo(
    () => historySummary.filter((day) => day.date < state.date),
    [historySummary, state.date]
  );
  const historicalTodaySelection = useHistoricalTodaySelection({
    history: historicalHistorySummary,
    historyDayByDate,
    isHistoryDayLoading,
    loadHistoryDay: actions.history.loadDay,
    loadingHistoryDayKey,
  });
  const isViewingHistoricalDay = historicalTodaySelection.selectedDate !== null;
  useTodayPopups({
    completedCount: streakEligibleCompletedCount,
    dailyHabits,
    state,
  });

  const celebration = useTodayCelebration({
    completedCount: streakEligibleCompletedCount,
    dailyHabitCount: dailyHabits.length,
    date: state.date,
    streak: state.streak,
  });
  const {
    getRowProps,
    handleIncrementPeriodicHabit,
    handleToggleCarryover,
    handleToggleDailyHabit,
    keyboardHint,
  } = useTodayKeyboardRows({
    dailyHabits,
    onDecrementHabitProgress: habitManagementActions.decrementProgress,
    onIncrementHabitProgress: habitManagementActions.incrementProgress,
    onToggleHabit: habitManagementActions.toggleHabit,
    onToggleHabitCarryover: habitManagementActions.toggleCarryover,
    periodicHabits,
    state,
  });
  return (
    <>
      <TodayCelebrationOverlay celebration={celebration} />
      <TodayKeyboardHint hint={keyboardHint} />

      <div
        className="grid w-full min-w-0 max-w-full gap-6"
        data-screenshot-ready={hasLoadedHistorySummary ? "true" : undefined}
      >
        <section className="min-w-0">
          <TodayHistoryCarousel
            hasLoadedHistorySummary={hasLoadedHistorySummary}
            history={historicalHistorySummary}
            onSelectDate={historicalTodaySelection.handleSelectDate}
            selectedDate={historicalTodaySelection.selectedDate}
          />
        </section>

        {isViewingHistoricalDay ? (
          <section>
            {historicalTodaySelection.isLoading ||
            !historicalTodaySelection.selectedDay ? (
              <div className="rounded-md border border-dashed border-border/60 bg-card/60 px-4 py-6 text-sm text-muted-foreground">
                Loading history…
              </div>
            ) : (
              <HistoricalTodayView
                day={historicalTodaySelection.selectedDay}
                onReturnToToday={historicalTodaySelection.handleClearSelection}
              />
            )}
          </section>
        ) : null}

        {isViewingHistoricalDay ? null : (
          <>
            <section>
              <HabitChecklist
                icon={ListChecks}
                completedCount={completedDailyHabitCount}
                emptyMessage="No daily habits yet. Create one to start building momentum."
                emptyAction={
                  <TodayHabitManagerDialog
                    actions={habitManagementActions}
                    habits={managedHabits}
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
                    actions={habitManagementActions}
                    habits={managedHabits}
                  />
                }
                habits={dailyHabits}
                pausedHabits={pausedHabits}
                isPaused={state.dayStatus !== null}
                getKeyboardRowProps={getRowProps}
                onResumeHabit={resumeHabit}
                onToggleHabit={handleToggleDailyHabit}
                {...(state.habitStreaks
                  ? { habitStreaks: state.habitStreaks }
                  : {})}
                {...(state.categoryStreaks
                  ? { categoryStreaks: state.categoryStreaks }
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
                <PeriodicHabitChecklist
                  dateKey={state.date}
                  focusQuotaGoals={state.focusQuotaGoals ?? []}
                  habits={periodicHabits}
                  getKeyboardRowProps={getRowProps}
                  onDecrementHabitProgress={
                    habitManagementActions.decrementProgress
                  }
                  onIncrementHabitProgress={handleIncrementPeriodicHabit}
                />
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
});
