import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { CalendarDays, Flame, Snowflake, Timer } from "lucide-react";
import { memo, useMemo } from "react";

import { HabitActivityCard } from "@/renderer/shared/components/activity-ring";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import { RING_COLORS } from "@/renderer/shared/lib/ring-colors";
import type { HabitCategoryProgress } from "@/shared/domain/habit";
import { formatDateKey } from "@/shared/utils/date";

interface StreakCardProps {
  availableFreezes: number;
  categoryProgress: HabitCategoryProgress[];
  currentStreak: number;
  dateLabel: string;
  focusMinutes: number;
}

interface StatConfig {
  color: string | undefined;
  icon: React.ElementType;
  label: string;
  suffix?: string;
  value: number | string;
}

function StreakCardComponent({
  availableFreezes,
  categoryProgress,
  currentStreak,
  dateLabel,
  focusMinutes,
}: StreakCardProps) {
  const formattedDate = useMemo(
    () =>
      formatDateKey(dateLabel, {
        day: "numeric",
        month: "short",
        weekday: "short",
      }),
    [dateLabel]
  );

  const stats: StatConfig[] = useMemo(
    () => [
      {
        color: RING_COLORS.fitness.base,
        icon: Flame,
        label: "Streak",
        value: currentStreak,
      },
      {
        color: RING_COLORS.productivity.base,
        icon: Snowflake,
        label: "Freeze",
        value: availableFreezes,
      },
      {
        color: RING_COLORS.nutrition.base,
        icon: Timer,
        label: "Focus",
        suffix: "m",
        value: focusMinutes,
      },
      {
        color: undefined,
        icon: CalendarDays,
        label: "Date",
        value: formattedDate,
      },
    ],
    [availableFreezes, currentStreak, focusMinutes, formattedDate]
  );

  return (
    <LazyMotion features={domAnimation}>
      <Card className="border border-border/70 bg-card/95">
        <CardContent className="grid gap-6 p-0 lg:p-2">
          <div className="flex justify-center">
            <HabitActivityCard categoryProgress={categoryProgress} />
          </div>

          {/* CHECK: Abstract out a stat card component */}
          <div className="flex flex-wrap justify-center gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const c = stat.color;

              return (
                <m.div
                  key={stat.label}
                  whileHover={hoverLift}
                  whileTap={tapPress}
                >
                  <Card size="sm">
                    <CardContent className="flex items-center gap-3">
                      <span
                        className="rounded-full border p-2"
                        {...(c
                          ? {
                              style: {
                                backgroundColor: `color-mix(in srgb, ${c} 12%, transparent)`,
                                borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
                                color: c,
                              },
                            }
                          : {})}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="space-y-0.5">
                        <AnimatePresence initial={false} mode="popLayout">
                          <m.p
                            key={`${stat.label}-${stat.value}`}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-base leading-none font-semibold"
                            exit={{ opacity: 0, y: -8 }}
                            initial={{ opacity: 0, y: 8 }}
                            {...(c ? { style: { color: c } } : {})}
                            transition={microTransition}
                          >
                            {stat.value}
                            {stat.suffix}
                          </m.p>
                        </AnimatePresence>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </LazyMotion>
  );
}

export const StreakCard = memo(StreakCardComponent);
