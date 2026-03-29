import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/renderer/shared/ui/badge";
import { Button } from "@/renderer/shared/ui/button";
import { Card, CardContent } from "@/renderer/shared/ui/card";
import type {
  WeeklyReview,
  WeeklyReviewListItem,
} from "@/shared/domain/weekly-review";

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

  return (
    <Card className="overflow-hidden border-border/60 bg-card py-0">
      <CardContent className="relative overflow-hidden px-6 py-6 sm:px-7">
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">Weekly review</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{review.label}</p>
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                {review.completionRate}%
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {review.completedDays} fully completed days, {review.freezeDays}{" "}
                freeze saves, and a {review.longestCleanRun}-day clean run.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border/40 bg-zinc-500/5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="ui-eyebrow">Tracked days</p>
                <p className="mt-1 text-4xl font-black tracking-tight text-foreground">
                  {review.trackedDays}
                </p>
              </div>
              <div>
                <p className="ui-eyebrow">Habit chances</p>
                <p className="mt-1 text-4xl font-black tracking-tight text-foreground">
                  {review.habitMetrics.reduce(
                    (total, habit) => total + habit.opportunities,
                    0
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                disabled={!olderWeek || isLoading}
                onClick={() => {
                  if (olderWeek) {
                    onSelectWeek(olderWeek.weekStart);
                  }
                }}
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="size-3.5" />
                Older week
              </Button>
              <Button
                disabled={!newerWeek || isLoading}
                onClick={() => {
                  if (newerWeek) {
                    onSelectWeek(newerWeek.weekStart);
                  }
                }}
                size="sm"
                variant="ghost"
              >
                Newer week
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
