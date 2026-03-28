/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/renderer/shared/lib/class-names";
import { Button } from "@/renderer/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/ui/dialog";
import type {
  WeeklyReview,
  WeeklyReviewTrendPoint,
} from "@/shared/domain/weekly-review";

interface WeeklyReviewSpotlightDialogProps {
  onDismiss: () => void;
  onOpenReview: () => void;
  open: boolean;
  review: WeeklyReview;
  trend: WeeklyReviewTrendPoint[];
}

export function WeeklyReviewSpotlightDialog({
  onDismiss,
  onOpenReview,
  open,
  review,
  trend,
}: WeeklyReviewSpotlightDialogProps) {
  const recentTrend = trend.slice(-6);
  const latestTrendPoint = recentTrend.at(-1) ?? null;
  const previousTrendPoint = recentTrend.at(-2) ?? null;
  const hasTrendComparison = recentTrend.length >= 2;
  const trendDelta =
    latestTrendPoint && previousTrendPoint
      ? latestTrendPoint.completionRate - previousTrendPoint.completionRate
      : null;
  let TrendIcon = Minus;
  let trendHeadline = "Baseline set";
  let trendDescription = `This week closed at ${review.completionRate}%. Finish one more week to unlock week-over-week direction.`;

  if (trendDelta !== null) {
    trendHeadline = "Flat week";
    trendDescription = "Weekly completion rate matched the previous week.";

    if (trendDelta > 0) {
      TrendIcon = TrendingUp;
      trendHeadline = `Up ${trendDelta} pts`;
    } else if (trendDelta < 0) {
      TrendIcon = TrendingDown;
      trendHeadline = `Down ${Math.abs(trendDelta)} pts`;
    }

    if (trendDelta !== 0) {
      trendDescription = `Weekly completion rate: ${latestTrendPoint?.completionRate}% this week vs ${previousTrendPoint?.completionRate}% last week.`;
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onDismiss();
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Monday review
          </div>
          <DialogTitle>{review.label}</DialogTitle>
          <DialogDescription>
            {`Last week landed at ${review.completionRate}% with ${review.completedDays} completed days and a closing streak of ${review.endingStreak ?? 0}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="grid gap-3 rounded-[24px] border border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Freeze saves
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight text-foreground">
                {review.freezeDays}
              </p>
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Clean run
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight text-foreground">
                {review.longestCleanRun}
              </p>
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Trend
              </p>
              <div className="mt-1 rounded-2xl border border-border/50 bg-background/40 p-3">
                {hasTrendComparison ? (
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <TrendIcon className="size-4" />
                    </div>
                    <div>
                      <p className="text-lg font-black tracking-tight text-foreground">
                        {trendHeadline}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trendDescription}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black tracking-tight text-foreground">
                        {trendHeadline}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trendDescription}
                      </p>
                    </div>
                    <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-primary">
                      Week 1
                    </div>
                  </div>
                )}
                {hasTrendComparison ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={cn(
                          "rounded-2xl border px-3 py-2",
                          "border-border/50 bg-card/60"
                        )}
                      >
                        <p className="text-[0.6rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                          Last week
                        </p>
                        <p className="mt-1 text-xl font-black tracking-tight text-foreground">
                          {previousTrendPoint?.completionRate}%
                        </p>
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl border px-3 py-2",
                          "border-primary/30 bg-primary/10"
                        )}
                      >
                        <p className="text-[0.6rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                          This week
                        </p>
                        <p className="mt-1 text-xl font-black tracking-tight text-foreground">
                          {latestTrendPoint?.completionRate}%
                        </p>
                      </div>
                    </div>
                    <div className="flex h-9 items-end gap-2">
                      {recentTrend.slice(-4).map((point) => {
                        const isCurrent =
                          point.weekStart === latestTrendPoint?.weekStart;

                        return (
                          <div
                            key={point.weekStart}
                            className="flex flex-1 items-end"
                            title={`${point.label}: ${point.completionRate}%`}
                          >
                            <div
                              className={cn(
                                "w-full rounded-full",
                                isCurrent ? "bg-primary" : "bg-primary/25"
                              )}
                              style={{
                                height: `${Math.max(
                                  8,
                                  Math.round(point.completionRate * 0.28)
                                )}px`,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[0.6rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                      <span>This week</span>
                      <span>{review.completionRate}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-primary/12">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${review.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onDismiss} variant="ghost">
            Dismiss
          </Button>
          <Button onClick={onOpenReview}>
            <BarChart3 className="size-4" />
            Open weekly review
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
