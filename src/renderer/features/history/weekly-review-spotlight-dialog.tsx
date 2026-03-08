import { ArrowRight, BarChart3, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
            Last week landed at {review.completionRate}% with{" "}
            {review.completedDays}
            completed days and a closing streak of {review.endingStreak ?? 0}.
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
              <div className="mt-2 flex items-end gap-1">
                {trend.slice(-6).map((point) => (
                  <div
                    key={point.weekStart}
                    className="w-full rounded-full bg-primary/15"
                  >
                    <div
                      className="rounded-full bg-primary"
                      style={{
                        height: `${Math.max(14, point.completionRate)}px`,
                      }}
                    />
                  </div>
                ))}
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
