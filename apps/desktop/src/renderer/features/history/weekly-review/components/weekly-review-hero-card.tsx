import {
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Pause,
  Snowflake,
  Timer,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import type {
  WeeklyReview,
  WeeklyReviewListItem,
} from "@/shared/domain/weekly-review";

import { WeeklyReviewHeroStat } from "./weekly-review-hero-stat";

interface WeeklyReviewHeroCardProps {
  availableWeeks: WeeklyReviewListItem[];
  isLoading: boolean;
  onSelectWeek: (weekStart: string) => void;
  review: WeeklyReview;
}

export function WeeklyReviewHeroCard({
  availableWeeks,
  isLoading,
  onSelectWeek,
  review,
}: WeeklyReviewHeroCardProps) {
  const currentIndex = availableWeeks.findIndex(
    (week) => week.weekStart === review.weekStart
  );
  const newerWeek =
    currentIndex > 0 ? availableWeeks[currentIndex - 1] : undefined;
  const olderWeek =
    currentIndex === -1 ? undefined : availableWeeks[currentIndex + 1];

  const STATS = [
    {
      icon: TrendingUp,
      label: "Completed",
      value: review.completedDays,
    },
    {
      icon: Snowflake,
      label: "Freezes",
      value: review.freezeDays,
    },
    {
      icon: HeartPulse,
      label: "Sick",
      value: review.sickDays,
    },
    {
      icon: Pause,
      label: "Rest",
      value: review.restDays,
    },
    {
      icon: Timer,
      label: "Focus",
      value: `${review.focusMinutes}m`,
    },
  ];

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="relative overflow-hidden px-6 py-6 sm:px-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">Weekly review</Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {review.label}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                {review.completionRate}%
              </h2>
              <p className="text-sm text-muted-foreground">completion rate</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-2xl border border-border/40 bg-zinc-500/5 p-5">
            <div className="grid grid-cols-5 gap-4 sm:gap-6">
              {STATS.map((stat) => (
                <WeeklyReviewHeroStat key={stat.label} {...stat} />
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
              <Button
                disabled={!olderWeek || isLoading}
                onClick={() => {
                  if (olderWeek) {
                    onSelectWeek(olderWeek.weekStart);
                  }
                }}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <ChevronLeft className="size-3.5" />
                Older
              </Button>
              <div className="text-xs font-medium text-muted-foreground">
                {review.trackedDays} days /{" "}
                {review.habitMetrics.reduce(
                  (total, habit) => total + habit.opportunities,
                  0
                )}{" "}
                chances
              </div>
              <Button
                disabled={!newerWeek || isLoading}
                onClick={() => {
                  if (newerWeek) {
                    onSelectWeek(newerWeek.weekStart);
                  }
                }}
                size="sm"
                variant="ghost"
                className="h-8"
              >
                Newer
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
