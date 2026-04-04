import { LazyMotion, domAnimation } from "framer-motion";
import { CalendarDays, Flame, Snowflake, Timer } from "lucide-react";
import type { ElementType } from "react";
import { memo, useMemo } from "react";

import { HabitActivityCard } from "@/renderer/shared/components/activity-ring";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { StatCard } from "@/renderer/shared/components/ui/stat-card";
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
  icon: ElementType;
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
      <Card>
        <CardContent className="grid gap-6 p-0 lg:p-2">
          <div className="flex justify-center">
            <HabitActivityCard categoryProgress={categoryProgress} />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {stats.map((stat) => {
              const statCardProps = stat.color ? { color: stat.color } : {};
              const suffixProps = stat.suffix ? { suffix: stat.suffix } : {};

              return (
                <StatCard
                  key={stat.label}
                  animatedValue={stat.label !== "Date"}
                  icon={stat.icon}
                  label={stat.label}
                  size="md"
                  value={stat.value}
                  valueKey={`${stat.label}-${stat.value}`}
                  {...statCardProps}
                  {...suffixProps}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </LazyMotion>
  );
}

export const StreakCard = memo(StreakCardComponent);
