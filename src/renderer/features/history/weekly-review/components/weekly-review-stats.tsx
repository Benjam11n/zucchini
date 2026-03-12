import { Flame, Snowflake, Target, TrendingUp } from "lucide-react";

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
] as const;

export function WeeklyReviewStats({ review }: WeeklyReviewStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((stat) => {
        const value = review[stat.key];

        return (
          <Card key={stat.key} className="border-border/60 bg-card/90">
            <CardContent className="flex items-center gap-3 px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground">
                <stat.icon className="size-4.5" />
              </div>
              <div className="space-y-1">
                <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-black tracking-tight text-foreground">
                  {value ?? 0}
                  {"suffix" in stat ? stat.suffix : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
