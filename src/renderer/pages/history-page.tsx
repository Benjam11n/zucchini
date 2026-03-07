import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Snowflake, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DayButtonProps } from "react-day-picker";

import { HabitActivityRingGlyph } from "@/components/custom/apple-activity-ring";
import { GitHubCalendar } from "@/components/custom/github-calendar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  HISTORY_METRIC_BADGE_CLASSNAMES,
  HISTORY_STATUS_UI,
} from "@/renderer/lib/history-status";
import {
  hoverLift,
  microTransition,
  staggerContainerVariants,
  staggerItemVariants,
  tapPress,
} from "@/renderer/lib/motion";
import type { HistoryDay } from "@/shared/domain/history";

import { HABIT_CATEGORY_UI } from "../lib/habit-categories";
import {
  buildContributionWeeks,
  formatContributionLabel,
  formatDateKey,
  getActivityBadgeLabel,
  getActivityStatus,
  getActivitySummary,
  getHistoryDayLookup,
  getHistoryStats,
  parseDateKey,
  toDateKey,
} from "./history-page.utils";

interface HistoryPageProps {
  history: HistoryDay[];
}

interface HistoryCalendarContextValue {
  historyByDate: Map<string, HistoryDay>;
  onSelectDate: (dateKey: string) => void;
  selectedDateKey: string | null;
}

const HistoryCalendarContext =
  createContext<HistoryCalendarContextValue | null>(null);

function HistoryCalendarDayButton({
  className,
  day,
  disabled,
  onClick,
  onDrag: _onDrag,
  onDragEnd: _onDragEnd,
  onDragStart: _onDragStart,
  ...props
}: DayButtonProps) {
  const context = useContext(HistoryCalendarContext);

  if (!context) {
    return (
      <button
        {...props}
        className={className}
        disabled={disabled}
        onClick={onClick}
        type="button"
      />
    );
  }

  const { historyByDate, onSelectDate, selectedDateKey } = context;
  const dateKey = toDateKey(day.date);
  const dayEntry = historyByDate.get(dateKey);
  const isSelected = selectedDateKey === dateKey;

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      initial={{ opacity: 0, scale: 0.96 }}
      transition={microTransition}
      whileHover={dayEntry && !disabled ? hoverLift : undefined}
      whileTap={dayEntry && !disabled ? tapPress : undefined}
    >
      <button
        {...props}
        className={cn(
          className,
          "flex h-auto min-h-[4.9rem] w-full flex-col items-center gap-1 rounded-[22px] border px-1.5 py-2 transition-colors",
          dayEntry
            ? "border-border/60 bg-background/55 hover:border-border hover:bg-background"
            : "border-transparent bg-transparent text-muted-foreground/45",
          isSelected &&
            "border-primary/60 bg-primary/8 shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]",
          disabled && "cursor-default"
        )}
        disabled={!dayEntry || disabled}
        onClick={(event) => {
          onClick?.(event);

          if (!dayEntry) {
            return;
          }

          onSelectDate(dateKey);
        }}
        type="button"
      >
        <span className="text-[0.68rem] font-semibold text-foreground">
          {day.date.getDate()}
        </span>
        {dayEntry ? (
          <HabitActivityRingGlyph
            categoryProgress={dayEntry.categoryProgress}
            size={34}
          />
        ) : (
          <span className="mt-1 text-[0.65rem] text-muted-foreground">-</span>
        )}
      </button>
    </motion.div>
  );
}

export function HistoryPage({ history }: HistoryPageProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    history[0]?.date ?? null
  );
  const [visibleMonth, setVisibleMonth] = useState<Date | undefined>(
    history[0] ? parseDateKey(history[0].date) : undefined
  );
  const stats = getHistoryStats(history);
  const historyByDate = useMemo(() => getHistoryDayLookup(history), [history]);
  const selectedDay =
    (selectedDateKey ? historyByDate.get(selectedDateKey) : null) ??
    history[0] ??
    null;
  const completedHabits =
    selectedDay?.habits.filter((habit) => habit.completed) ?? [];
  const remainingHabits =
    selectedDay?.habits.filter((habit) => !habit.completed) ?? [];
  const calendarWeeks = buildContributionWeeks(history).map((week) => ({
    ...week,
    cells: week.cells.map((cell) => ({
      date: cell.date,
      isToday: cell.isToday,
      label: formatContributionLabel(cell),
      status: cell.status,
    })),
  }));

  useEffect(() => {
    const fallbackDate = history[0]?.date ?? null;

    if (!fallbackDate) {
      setSelectedDateKey(null);
      setVisibleMonth(undefined);
      return;
    }

    setSelectedDateKey((current) =>
      current && history.some((day) => day.date === current)
        ? current
        : fallbackDate
    );
    setVisibleMonth((current) => current ?? parseDateKey(fallbackDate));
  }, [history]);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    setVisibleMonth(parseDateKey(dateKey));
  }, []);

  const historyCalendarContextValue = useMemo(
    () => ({
      historyByDate,
      onSelectDate: handleSelectDate,
      selectedDateKey: selectedDay?.date ?? null,
    }),
    [handleSelectDate, historyByDate, selectedDay?.date]
  );

  return (
    <motion.div
      animate="animate"
      className="grid gap-6"
      initial="initial"
      variants={staggerContainerVariants}
    >
      <motion.div variants={staggerItemVariants}>
        <Card>
          <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardDescription>History</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  className: HISTORY_METRIC_BADGE_CLASSNAMES.completionRate,
                  label: `${stats.completionRate}% completion`,
                },
                {
                  className: HISTORY_METRIC_BADGE_CLASSNAMES.completedDays,
                  label: `${stats.completedDays} complete`,
                },
                {
                  className: HISTORY_METRIC_BADGE_CLASSNAMES.freezeDays,
                  label: `${stats.freezeDays} freeze saves`,
                },
                {
                  className: HISTORY_METRIC_BADGE_CLASSNAMES.missedDays,
                  label: `${stats.missedDays} missed`,
                },
              ].map((statBadge) => (
                <motion.div
                  key={statBadge.label}
                  whileHover={hoverLift}
                  whileTap={tapPress}
                >
                  <Badge className={statBadge.className} variant="outline">
                    {statBadge.label}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]"
        variants={staggerItemVariants}
      >
        <Card>
          <CardContent className="space-y-5">
            <GitHubCalendar weeks={calendarWeeks} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="rounded-[28px] border border-border/60 bg-background/30 p-2">
              <HistoryCalendarContext.Provider
                value={historyCalendarContextValue}
              >
                <Calendar
                  components={{ DayButton: HistoryCalendarDayButton }}
                  mode="single"
                  month={visibleMonth}
                  onMonthChange={setVisibleMonth}
                  onSelect={(date) => {
                    if (!date) {
                      return;
                    }

                    const nextDateKey = toDateKey(date);

                    if (!historyByDate.has(nextDateKey)) {
                      return;
                    }

                    setSelectedDateKey(nextDateKey);
                  }}
                  selected={
                    selectedDay ? parseDateKey(selectedDay.date) : undefined
                  }
                  showOutsideDays
                />
              </HistoryCalendarContext.Provider>
            </div>

            {selectedDay ? (
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={selectedDay.date}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 rounded-[28px] border border-border/60 bg-background/35 p-4"
                  exit={{ opacity: 0, y: -10 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={microTransition}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                        Selected day
                      </p>
                      <h3 className="text-lg font-semibold text-foreground">
                        {formatDateKey(selectedDay.date, {
                          day: "numeric",
                          month: "short",
                          weekday: "short",
                          year: "numeric",
                        })}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getActivitySummary(selectedDay.summary)}
                      </p>
                    </div>

                    <Badge
                      className={
                        HISTORY_STATUS_UI[
                          getActivityStatus(selectedDay.summary)
                        ].badgeClassName
                      }
                      variant="outline"
                    >
                      {getActivityBadgeLabel(selectedDay.summary)}
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/85 px-4 py-5">
                      <HabitActivityRingGlyph
                        categoryProgress={selectedDay.categoryProgress}
                        size={132}
                      />
                      <p className="text-xs text-muted-foreground">
                        Streak after day:{" "}
                        {selectedDay.summary.streakCountAfterDay}
                      </p>
                      {selectedDay.summary.freezeUsed ? (
                        <motion.div
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2 rounded-full border border-secondary/60 bg-secondary/12 px-3 py-1 text-xs text-secondary-foreground"
                          initial={{ opacity: 0, scale: 0.94 }}
                          transition={microTransition}
                        >
                          <Snowflake className="size-3.5" />
                          Freeze preserved the streak for this day
                        </motion.div>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      {selectedDay.categoryProgress.map((progress) => {
                        const categoryUi = HABIT_CATEGORY_UI[progress.category];

                        return (
                          <motion.div
                            key={progress.category}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-border/60 bg-card/85 p-3"
                            initial={{ opacity: 0, y: 8 }}
                            transition={microTransition}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={cn(
                                  "text-xs font-semibold tracking-[0.18em] uppercase",
                                  categoryUi.textClassName
                                )}
                              >
                                {progress.category}
                              </span>
                              <span className="text-sm font-semibold text-foreground">
                                {progress.completed}/{progress.total}
                              </span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-muted/60">
                              <motion.div
                                animate={{ width: `${progress.progress}%` }}
                                className={cn(
                                  "h-full rounded-full",
                                  categoryUi.progressClassName
                                )}
                                initial={{ width: 0 }}
                                transition={microTransition}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-card/85 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CheckCircle2 className="size-4 text-primary" />
                        Completed
                      </div>
                      <div className="space-y-2">
                        {completedHabits.length > 0 ? (
                          completedHabits.map((habit) => (
                            <motion.div
                              key={habit.id}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2"
                              initial={{ opacity: 0, x: -8 }}
                              transition={microTransition}
                            >
                              <span className="text-sm text-foreground">
                                {habit.name}
                              </span>
                              <Badge
                                className={
                                  HABIT_CATEGORY_UI[habit.category]
                                    .badgeClassName
                                }
                                variant="outline"
                              >
                                {habit.category}
                              </Badge>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Nothing was completed on this day.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card/85 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <XCircle className="size-4 text-muted-foreground" />
                        Not completed
                      </div>
                      <div className="space-y-2">
                        {remainingHabits.length > 0 ? (
                          remainingHabits.map((habit) => (
                            <motion.div
                              key={habit.id}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2"
                              initial={{ opacity: 0, x: 8 }}
                              transition={microTransition}
                            >
                              <span className="text-sm text-foreground">
                                {habit.name}
                              </span>
                              <Badge
                                className={
                                  HABIT_CATEGORY_UI[habit.category]
                                    .badgeClassName
                                }
                                variant="outline"
                              >
                                {habit.category}
                              </Badge>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Everything was completed on this day.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/20 p-4 text-sm text-muted-foreground">
                No tracked days yet. Start completing habits to unlock the
                calendar browser.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
