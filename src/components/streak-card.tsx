import { CalendarDays, Flame, Snowflake } from "lucide-react";

import { HabitActivityCard } from "@/components/custom/apple-activity-ring";
import { Card, CardContent } from "@/components/ui/card";
import { RING_COLORS } from "@/renderer/lib/ring-colors";
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

export function StreakCard({
  currentStreak,
  availableFreezes,
  categoryProgress,
  dateLabel,
}: StreakCardProps) {
  const formattedDate = formatDateKey(dateLabel, {
    day: "numeric",
    month: "short",
    weekday: "short",
  });

  const stats: StatConfig[] = [
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
  ];

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
              <div key={stat.label}>
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
                      <p
                        className="text-base leading-none font-semibold"
                        style={c ? { color: c } : undefined}
                      >
                        {stat.value}
                      </p>
                      <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
