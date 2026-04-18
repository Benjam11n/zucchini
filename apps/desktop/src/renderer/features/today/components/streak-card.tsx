import { LazyMotion, domAnimation } from "framer-motion";
import {
  CalendarDays,
  Flame,
  MoreHorizontal,
  Snowflake,
  Timer,
} from "lucide-react";
import type { ElementType } from "react";
import { memo, useMemo } from "react";

import { HabitActivityCard } from "@/renderer/shared/components/activity-ring";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/renderer/shared/components/ui/dropdown-menu";
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
  isSickDay: boolean;
  onToggleSickDay: () => void;
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
  isSickDay,
  onToggleSickDay,
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
          <div className="flex justify-end px-4 pt-4 lg:px-2 lg:pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open streak options"
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggleSickDay}>
                  {isSickDay ? "Undo sick day" : "Mark today sick"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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

          {isSickDay ? (
            <p className="-mt-2 text-center text-xs text-muted-foreground">
              Today marked sick. Streak preserved.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </LazyMotion>
  );
}

export const StreakCard = memo(StreakCardComponent);
