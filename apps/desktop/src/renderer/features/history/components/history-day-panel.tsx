import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { CheckCircle2, Snowflake, XCircle } from "lucide-react";

import { HISTORY_STATUS_UI } from "@/renderer/features/history/history-status-ui";
import {
  getActivityBadgeLabel,
  getActivityStatus,
  getActivitySummary,
} from "@/renderer/features/history/lib/history-summary";
import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  HABIT_CATEGORY_ICONS,
  HABIT_CATEGORY_UI,
} from "@/renderer/shared/lib/habit-categories";
import { microTransition } from "@/renderer/shared/lib/motion";
import { Badge } from "@/renderer/shared/ui/badge";
import { Card, CardContent } from "@/renderer/shared/ui/card";
import { Progress } from "@/renderer/shared/ui/progress";
import type { HistoryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

import { HistoryHabitColumn } from "./history-habit-column";

interface HistoryDayPanelProps {
  selectedDay: HistoryDay | null;
  isToday?: boolean;
}

export function HistoryDayPanel({
  selectedDay,
  isToday,
}: HistoryDayPanelProps) {
  if (!selectedDay) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-background/20 p-4 text-sm text-muted-foreground">
        No tracked days yet. Start completing habits to unlock the calendar
        browser.
      </div>
    );
  }

  const uniqueHabits = [
    ...new Map(selectedDay.habits.map((h) => [h.id, h])).values(),
  ];

  const dailyHabits = uniqueHabits.filter((h) => h.frequency === "daily");
  const longTermHabits = uniqueHabits.filter((h) => h.frequency !== "daily");

  const completedDaily = dailyHabits.filter((habit) => habit.completed);
  const remainingDaily = dailyHabits.filter((habit) => !habit.completed);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false} mode="wait">
        <m.div
          key={selectedDay.date}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-[28px] border border-border/60 bg-background/35 p-4"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={microTransition}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {formatDateKey(selectedDay.date, {
                  day: "numeric",
                  month: "short",
                  weekday: "short",
                  year: "numeric",
                })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {getActivitySummary(selectedDay.summary, isToday)}
              </p>
            </div>

            <Badge
              className={
                HISTORY_STATUS_UI[
                  getActivityStatus(selectedDay.summary, isToday)
                ].badgeClassName
              }
              variant="outline"
            >
              {getActivityBadgeLabel(selectedDay.summary, isToday)}
            </Badge>
          </div>

          <div className="grid gap-4">
            <Card className="border-border/60 bg-card/85">
              <CardContent className="flex flex-col items-center gap-3 px-4 py-5">
                <HabitActivityRingGlyph
                  categoryProgress={selectedDay.categoryProgress}
                  size={132}
                />
                <p className="text-xs text-muted-foreground">
                  Streak after day: {selectedDay.summary.streakCountAfterDay}
                </p>
                {selectedDay.summary.freezeUsed ? (
                  <m.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-full border border-secondary/60 bg-secondary/12 px-3 py-1 text-xs text-secondary-foreground dark:text-secondary"
                    initial={{ opacity: 0, scale: 0.94 }}
                    transition={microTransition}
                  >
                    <Snowflake className="size-3.5" />
                    Freeze preserved the streak for this day
                  </m.div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/85">
              <CardContent className="grid gap-4 p-4">
                {selectedDay.categoryProgress.map((progress) => {
                  const categoryUi = HABIT_CATEGORY_UI[progress.category];
                  const CategoryIcon = HABIT_CATEGORY_ICONS[progress.category];

                  return (
                    <m.div
                      key={progress.category}
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 8 }}
                      transition={microTransition}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <CategoryIcon
                            aria-hidden="true"
                            className="size-3 shrink-0 opacity-60"
                            data-testid={`history-category-icon-${progress.category}`}
                            style={{ color: categoryUi.ringColor }}
                          />
                          <span
                            className="text-[0.68rem] tracking-[0.14em] uppercase"
                            style={{ color: categoryUi.ringColor }}
                          >
                            {progress.category}
                          </span>
                        </span>
                        <span className="text-[0.68rem] tabular-nums text-muted-foreground/60">
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                      <Progress
                        className="mt-1.5 h-1.5 bg-muted/60"
                        indicatorClassName={categoryUi.progressClassName}
                        value={progress.progress}
                      />
                    </m.div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HistoryHabitColumn
              emptyLabel="Nothing was completed on this day."
              habits={completedDaily}
              icon={CheckCircle2}
              iconClassName="size-4 text-primary"
              initialX={-8}
              title="Completed"
            />
            <HistoryHabitColumn
              emptyLabel="Everything was completed on this day."
              habits={remainingDaily}
              icon={XCircle}
              iconClassName="size-4 text-muted-foreground"
              initialX={8}
              title="Not completed"
            />
          </div>

          {longTermHabits.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Long-term Goals
              </h4>
              <div className="flex flex-wrap gap-2">
                {longTermHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                      habit.completed
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 bg-background/50 text-muted-foreground"
                    )}
                  >
                    {habit.completed ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <div className="size-3.5 rounded-full border border-current" />
                    )}
                    {habit.name}
                    <Badge
                      variant="secondary"
                      className="ml-1 text-[0.65rem] h-4 px-1 capitalize"
                    >
                      {habit.frequency}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
