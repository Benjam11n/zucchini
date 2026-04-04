import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Snowflake,
  Timer,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";

import { HISTORY_STATUS_UI } from "@/renderer/features/history/history-status-ui";
import {
  getActivityBadgeLabel,
  getActivityStatus,
} from "@/renderer/features/history/lib/history-summary";
import { HabitActivityCard } from "@/renderer/shared/components/activity-ring";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import { RING_COLORS } from "@/renderer/shared/lib/ring-colors";
import type { HistoryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

import { HistoryHabitColumn } from "./history-habit-column";

interface HistoryDayPanelProps {
  onNavigateToToday: () => void;
  selectedDay: HistoryDay | null;
  isToday?: boolean;
}

interface SummaryStatProps {
  color?: string;
  icon: ElementType;
  label: string;
  suffix?: string;
  value: number | string;
}

// CHECK: Instead of duplicating this in two places can we do something about it?
function SummaryStatCard({
  color,
  icon: Icon,
  label,
  suffix,
  value,
}: SummaryStatProps) {
  return (
    <m.div whileHover={hoverLift} whileTap={tapPress}>
      <Card className="py-2" size="sm">
        <CardContent className="flex items-center gap-2 px-3">
          <span
            className="rounded-full border p-1"
            {...(color
              ? {
                  style: {
                    backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                    color,
                  },
                }
              : {})}
          >
            <Icon className="size-3" />
          </span>
          <div className="space-y-0.5">
            <p
              className="text-xs leading-none font-semibold"
              {...(color ? { style: { color } } : {})}
            >
              {value}
              {suffix}
            </p>
            <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
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
          className="mt-4 rounded-full"
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
          className="space-y-3 rounded-xl border border-border/60 bg-card p-4"
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
                  <SummaryStatCard
                    color={RING_COLORS.fitness.base}
                    icon={Flame}
                    label="Streak"
                    value={selectedDay.summary.streakCountAfterDay}
                  />
                  <SummaryStatCard
                    color={RING_COLORS.nutrition.base}
                    icon={Timer}
                    label="Focus"
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
                  <div
                    key={`${goal.kind}-${goal.id}`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                      goal.completed
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 bg-background/50 text-muted-foreground"
                    )}
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <div className="size-3.5 rounded-full border border-current" />
                    )}
                    {`Focus quota • ${goal.completedMinutes}/${goal.targetMinutes} min`}
                    <Badge
                      className="ml-0.5 h-4 px-1 text-[0.65rem] capitalize"
                      variant="secondary"
                    >
                      {goal.frequency}
                    </Badge>
                  </div>
                ))}
                {longTermHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
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
                      className="ml-0.5 h-4 px-1 text-[0.65rem] capitalize"
                      variant="secondary"
                    >
                      {habit.frequency}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
