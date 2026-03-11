import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Snowflake, XCircle } from "lucide-react";

import { HabitActivityRingGlyph } from "@/components/custom/apple-activity-ring";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import { HISTORY_STATUS_UI } from "@/renderer/lib/history-status";
import { microTransition } from "@/renderer/lib/motion";
import {
  getActivityBadgeLabel,
  getActivityStatus,
  getActivitySummary,
} from "@/renderer/pages/history-page.utils";
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
              {getActivitySummary(selectedDay.summary, isToday)}
            </p>
          </div>

          <Badge
            className={
              HISTORY_STATUS_UI[getActivityStatus(selectedDay.summary, isToday)]
                .badgeClassName
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
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-full border border-secondary/60 bg-secondary/12 px-3 py-1 text-xs text-secondary-foreground dark:text-secondary"
                  initial={{ opacity: 0, scale: 0.94 }}
                  transition={microTransition}
                >
                  <Snowflake className="size-3.5" />
                  Freeze preserved the streak for this day
                </motion.div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/85">
            <CardContent className="grid gap-4 p-4">
              {selectedDay.categoryProgress.map((progress) => {
                const categoryUi = HABIT_CATEGORY_UI[progress.category];

                return (
                  <motion.div
                    key={progress.category}
                    animate={{ opacity: 1, y: 0 }}
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
                    <Progress
                      className="mt-2 h-2 bg-muted/60"
                      indicatorClassName={categoryUi.progressClassName}
                      value={progress.progress}
                    />
                  </motion.div>
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
      </motion.div>
    </AnimatePresence>
  );
}
