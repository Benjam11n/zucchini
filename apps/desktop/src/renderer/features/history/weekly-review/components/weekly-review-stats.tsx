import { Flame, Snowflake, Target, Timer, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/renderer/shared/ui/card";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

interface WeeklyReviewStatsProps {
  review: WeeklyReview;
}

const STATS = [
  {
    icon: Target,
    key: "completionRate",
    label: "Completion rate",
    suffix: "%",
  },
  {
    icon: TrendingUp,
    key: "completedDays",
    label: "Completed days",
  },
  {
    icon: Snowflake,
    key: "freezeDays",
    label: "Freeze saves",
  },
  {
    icon: Flame,
    key: "endingStreak",
    label: "Ending streak",
  },
  {
    icon: Timer,
    key: "focusMinutes",
    label: "Focus minutes",
  },
] as const;

export function WeeklyReviewStats({ review }: WeeklyReviewStatsProps) {
  return (
    <Card className="border-border/60 bg-card/90">
      <CardContent className="grid gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 lg:gap-8 lg:p-8">
        {STATS.map((stat) => {
          const value = review[stat.key];

          return (
            <div key={stat.key} className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted/50 text-foreground ring-1 ring-border/50">
                <stat.icon className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="ui-eyebrow line-clamp-1">{stat.label}</p>
                <p className="text-2xl font-black tracking-tight text-foreground">
                  {value ?? 0}
                  {"suffix" in stat ? stat.suffix : ""}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
