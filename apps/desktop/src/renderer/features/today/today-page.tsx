/**
 * Today tab page.
 *
 * This screen turns today's habit state into the daily flow the user sees:
 * recent history, streak summary, daily checklist, periodic habits, and
 * celebration toasts.
 */
import { ChevronDown, ListChecks, Pause, Play, Plus } from "lucide-react";
import { memo, useMemo, useState } from "react";

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
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/renderer/shared/components/ui/collapsible";
import { HabitListItem } from "@/renderer/shared/components/ui/habit-list";
import { cn } from "@/renderer/shared/lib/class-names";
import type { HabitMutationActions } from "@/renderer/shared/types/habit-actions";
import type { TodayState } from "@/shared/contracts/today-state";
import { isHabitPaused } from "@/shared/domain/habit";
import type { Habit, HabitWithStatus } from "@/shared/domain/habit";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface TodayPageProps extends Omit<
  HabitMutationActions,
  "onPauseHabit" | "onResumeHabit"
> {
  hasLoadedHistorySummary: boolean;
  historySummary: HistorySummaryDay[];
  managedHabits: Habit[];
  onDecrementHabitProgress: (habitId: number) => void;
  onIncrementHabitProgress: (habitId: number) => void;
  onPauseHabit?: HabitMutationActions["onPauseHabit"];
  onResumeHabit?: HabitMutationActions["onResumeHabit"];
  onToggleHabitCarryover: (sourceDate: string, habitId: number) => void;
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

const noopHabitMutation = () => Promise.resolve();

function PausedHabitsSection({
  habits,
  onResumeHabit,
}: {
  habits: Habit[];
  onResumeHabit: (habitId: number) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (habits.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/25 focus-visible:ring-3 focus-visible:ring-ring/50"
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Pause className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">Paused</span>
              <span className="text-xs text-muted-foreground">
                {habits.length}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">
                Paused habits do not count as missed and do not affect streaks.
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-px border-t border-border/60 pt-3">
            {habits.map((habit) => (
              <HabitListItem
                habit={
                  {
                    ...habit,
                    completed: false,
                    completedCount: 0,
                  } satisfies HabitWithStatus
                }
                key={habit.id}
                readOnly
                trailingActions={
                  <Button
                    onClick={async () => {
                      await onResumeHabit(habit.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Play className="size-3.5" />
                    Resume
                  </Button>
                }
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
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
  onPauseHabit = noopHabitMutation,
  onRenameHabit,
  onResumeHabit = noopHabitMutation,
  onReorderHabits,
  onUnarchiveHabit,
  state,
  onToggleHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: TodayPageProps) {
  const { completedDailyHabitCount, dailyHabits, periodicHabits } = useMemo(
    () => splitTodayHabits(state.habits),
    [state.habits]
  );
  const pausedHabits = useMemo(
    () => managedHabits.filter(isHabitPaused),
    [managedHabits]
  );
  const historicalHistorySummary = useMemo(
    () => historySummary.filter((day) => day.date < state.date),
    [historySummary, state.date]
  );
  const historicalTodaySelection = useHistoricalTodaySelection(
    historicalHistorySummary
  );
  const isViewingHistoricalDay = historicalTodaySelection.selectedDate !== null;
  useTodayPopups({
    completedCount: completedDailyHabitCount,
    dailyHabits,
    state,
  });

  const celebration = useTodayCelebration({
    completedCount: completedDailyHabitCount,
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
      <TodayKeyboardHint hint={keyboardHint} />

      <div className="grid w-full min-w-0 max-w-full gap-6">
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
                    habits={managedHabits}
                    onArchiveHabit={onArchiveHabit}
                    onCreateHabit={onCreateHabit}
                    onPauseHabit={onPauseHabit}
                    onRenameHabit={onRenameHabit}
                    onReorderHabits={onReorderHabits}
                    onResumeHabit={onResumeHabit}
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
                    onPauseHabit={onPauseHabit}
                    onRenameHabit={onRenameHabit}
                    onReorderHabits={onReorderHabits}
                    onResumeHabit={onResumeHabit}
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

            {pausedHabits.length > 0 ? (
              <section>
                <PausedHabitsSection
                  habits={pausedHabits}
                  onResumeHabit={onResumeHabit}
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
                  onDecrementHabitProgress={onDecrementHabitProgress}
                  onIncrementHabitProgress={handleIncrementPeriodicHabit}
                />
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

export const TodayPage = memo(TodayPageComponent);
