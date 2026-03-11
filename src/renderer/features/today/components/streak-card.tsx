import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Flame, Snowflake } from "lucide-react";
import { memo, useMemo } from "react";

import { HabitActivityCard } from "@/renderer/shared/components/activity-ring";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import { RING_COLORS } from "@/renderer/shared/lib/ring-colors";
import { Card, CardContent } from "@/renderer/shared/ui/card";
import type { HabitCategoryProgress } from "@/shared/domain/habit";
import { formatDateKey } from "@/shared/utils/date";

interface StreakCardProps {
  currentStreak: number;
  availableFreezes: number;
  categoryProgress: HabitCategoryProgress[];
  dateLabel: string;
}

interface StatConfig {
  color: string | undefined;
  icon: React.ElementType;
  label: string;
  value: number | string;
}

function StreakCardComponent({
  currentStreak,
  availableFreezes,
  categoryProgress,
  dateLabel,
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
        color: undefined,
        icon: CalendarDays,
        label: "Date",
        value: formattedDate,
      },
    ],
    [availableFreezes, currentStreak, formattedDate]
  );

  return (
    <Card>
      <CardContent className="grid gap-6 p-6 lg:p-8">
        <div className="flex justify-center">
          <HabitActivityCard categoryProgress={categoryProgress} />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const c = stat.color;

            return (
              <motion.div
                key={stat.label}
                whileHover={hoverLift}
                whileTap={tapPress}
              >
                <Card size="sm">
                  <CardContent className="flex items-center gap-3">
                    <span
                      className="rounded-full border p-2"
                      style={
                        c
                          ? {
                              backgroundColor: `color-mix(in srgb, ${c} 12%, transparent)`,
                              borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
                              color: c,
                            }
                          : undefined
                      }
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="space-y-0.5">
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.p
                          key={`${stat.label}-${stat.value}`}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-base leading-none font-semibold"
                          exit={{ opacity: 0, y: -8 }}
                          initial={{ opacity: 0, y: 8 }}
                          style={c ? { color: c } : undefined}
                          transition={microTransition}
                        >
                          {stat.value}
                        </motion.p>
                      </AnimatePresence>
                      <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export const StreakCard = memo(StreakCardComponent);
