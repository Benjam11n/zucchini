import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  HeartPulse,
  Pause,
  Snowflake,
  Timer,
  XCircle,
} from "lucide-react";

import { HistoryLongTermGoalChip } from "@/renderer/features/history/components/history-long-term-goal-chip";
import { HISTORY_STATUS_UI } from "@/renderer/features/history/history-status-ui";
import {
  getActivityBadgeLabel,
  getActivityStatus,
} from "@/renderer/features/history/lib/history-summary";
import { HabitActivityCard } from "@/renderer/shared/components/activity-ring";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { StatCard } from "@/renderer/shared/components/ui/stat-card";
import { microTransition } from "@/renderer/shared/lib/motion";
import { RING_COLORS } from "@/renderer/shared/lib/ring-colors";
import type { HistoryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

import { HistoryHabitColumn } from "./history-habit-column";

interface HistoryDayPanelProps {
  onNavigateToToday: () => void;
  selectedDay: HistoryDay | null;
  isToday?: boolean;
}

export function HistoryDayPanel({
  onNavigateToToday,
  selectedDay,
  isToday,
}: HistoryDayPanelProps) {
  if (!selectedDay) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-background/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No tracked days yet. Start completing habits to build your history.
        </p>
        <Button
          className="mt-4"
          onClick={onNavigateToToday}
          size="sm"
          variant="outline"
        >
          Go to Today <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  const uniqueHabits = [
    ...new Map(selectedDay.habits.map((h) => [h.id, h])).values(),
  ];

  const dailyHabits = uniqueHabits.filter((h) => h.frequency === "daily");
  const longTermHabits = uniqueHabits.filter((h) => h.frequency !== "daily");
  const focusQuotaGoals = selectedDay.focusQuotaGoals ?? [];

  const completedDaily = dailyHabits.filter((habit) => habit.completed);
  const remainingDaily = dailyHabits.filter((habit) => !habit.completed);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false} mode="wait">
        <m.div
          key={selectedDay.date}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-md border border-border/60 bg-card p-4"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={microTransition}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {formatDateKey(selectedDay.date, {
                  day: "numeric",
                  month: "short",
                  weekday: "short",
                  year: "numeric",
                })}
              </h3>
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

          <div className="grid gap-3">
            <Card>
              <CardContent>
                <div className="flex justify-center">
                  <HabitActivityCard
                    className="origin-center scale-[0.76]"
                    categoryProgress={selectedDay.categoryProgress}
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-2.5">
                  <StatCard
                    color={RING_COLORS.fitness.base}
                    icon={Flame}
                    label="Streak"
                    size="sm"
                    value={selectedDay.summary.streakCountAfterDay}
                  />
                  <StatCard
                    color={RING_COLORS.nutrition.base}
                    icon={Timer}
                    label="Focus"
                    size="sm"
                    suffix="m"
                    value={selectedDay.focusMinutes}
                  />
                </div>
                {selectedDay.summary.freezeUsed ? (
                  <m.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-auto flex items-center gap-1.5 rounded-full border border-secondary/60 bg-secondary/12 px-2.5 py-1 text-xs text-secondary-foreground dark:text-secondary"
                    initial={{ opacity: 0, scale: 0.94 }}
                    transition={microTransition}
                  >
                    <Snowflake className="size-3.5" />
                    Freeze preserved the streak for this day
                  </m.div>
                ) : null}
                {selectedDay.summary.dayStatus === "sick" ? (
                  <m.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-auto flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/8 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300"
                    initial={{ opacity: 0, scale: 0.94 }}
                    transition={microTransition}
                  >
                    <HeartPulse className="size-3.5" />
                    Sick day preserved the streak for this day
                  </m.div>
                ) : null}
                {selectedDay.summary.dayStatus === "rest" ? (
                  <m.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-auto flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/8 px-2.5 py-1 text-xs text-sky-700 dark:text-sky-300"
                    initial={{ opacity: 0, scale: 0.94 }}
                    transition={microTransition}
                  >
                    <Pause className="size-3.5" />
                    Rest day preserved the streak for this day
                  </m.div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
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

          {longTermHabits.length > 0 || focusQuotaGoals.length > 0 ? (
            <div className="space-y-2">
              <h4 className="ui-eyebrow">Long-term goals</h4>
              <div className="flex flex-wrap gap-1.5">
                {focusQuotaGoals.map((goal) => (
                  <HistoryLongTermGoalChip
                    key={`${goal.kind}-${goal.id}`}
                    goal={goal}
                  />
                ))}
                {longTermHabits.map((habit) => (
                  <HistoryLongTermGoalChip key={habit.id} habit={habit} />
                ))}
              </div>
            </div>
          ) : null}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
