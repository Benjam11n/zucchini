import { ArrowRight, BarChart3, CalendarDays } from "lucide-react";

import { Button } from "@/renderer/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/ui/dialog";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

interface WeeklyReviewSpotlightDialogProps {
  onDismiss: () => void;
  onOpenReview: () => void;
  open: boolean;
  review: WeeklyReview;
}

export function WeeklyReviewSpotlightDialog({
  onDismiss,
  onOpenReview,
  open,
  review,
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
        <DialogHeader>
          <div className="ui-eyebrow flex items-center gap-2 text-xs">
            <CalendarDays className="size-3.5" />
            Monday review
          </div>
          <DialogTitle>Weekly review is ready</DialogTitle>
          <DialogDescription>
            Your report for {review.label} is now available.
          </DialogDescription>
        </DialogHeader>

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
