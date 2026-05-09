import { ArrowRight, BarChart3, CalendarDays, X } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

interface WeeklyReviewSpotlightBannerProps {
  onDismiss: () => void;
  onOpenReview: () => void;
  review: WeeklyReview;
}

export function WeeklyReviewSpotlightBanner({
  onDismiss,
  onOpenReview,
  review,
}: WeeklyReviewSpotlightBannerProps) {
  return (
    <div className="rounded-md border border-primary/20 bg-primary/8 p-3 text-sm shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
            <CalendarDays className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              Weekly review is ready
            </p>
            <p className="text-muted-foreground">
              Your report for {review.label} is now available.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
          <Button onClick={onOpenReview} size="sm" type="button">
            <BarChart3 className="size-4" />
            Open
            <ArrowRight className="size-4" />
          </Button>
          <Button
            aria-label="Dismiss weekly review"
            onClick={onDismiss}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
