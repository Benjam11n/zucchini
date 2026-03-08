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
import { formatDateKey } from "@/shared/utils/date";
import type { HistoryDay } from "@/shared/domain/history";

import { HistoryHabitColumn } from "./history-habit-column";

interface HistoryDayPanelProps {
  selectedDay: HistoryDay | null;
}

export function HistoryDayPanel({ selectedDay }: HistoryDayPanelProps) {
  if (!selectedDay) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-background/20 p-4 text-sm text-muted-foreground">
        No tracked days yet. Start completing habits to unlock the calendar
        browser.
      </div>
    );
  }

  const completedHabits = selectedDay.habits.filter((habit) => habit.completed);
  const remainingHabits = selectedDay.habits.filter(
    (habit) => !habit.completed
  );

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
              {getActivitySummary(selectedDay.summary)}
            </p>
          </div>

          <Badge
            className={
              HISTORY_STATUS_UI[getActivityStatus(selectedDay.summary)]
                .badgeClassName
            }
            variant="outline"
          >
            {getActivityBadgeLabel(selectedDay.summary)}
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
                  className="flex items-center gap-2 rounded-full border border-secondary/60 bg-secondary/12 px-3 py-1 text-xs text-secondary-foreground"
                  initial={{ opacity: 0, scale: 0.94 }}
                  transition={microTransition}
                >
                  <Snowflake className="size-3.5" />
                  Freeze preserved the streak for this day
                </motion.div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {selectedDay.categoryProgress.map((progress) => {
              const categoryUi = HABIT_CATEGORY_UI[progress.category];

              return (
                <Card
                  key={progress.category}
                  className="border-border/60 bg-card/85"
                >
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 8 }}
                    transition={microTransition}
                  >
                    <CardContent className="p-3">
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
                    </CardContent>
                  </motion.div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <HistoryHabitColumn
            emptyLabel="Nothing was completed on this day."
            habits={completedHabits}
            icon={CheckCircle2}
            iconClassName="size-4 text-primary"
            initialX={-8}
            title="Completed"
          />
          <HistoryHabitColumn
            emptyLabel="Everything was completed on this day."
            habits={remainingHabits}
            icon={XCircle}
            iconClassName="size-4 text-muted-foreground"
            initialX={8}
            title="Not completed"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
