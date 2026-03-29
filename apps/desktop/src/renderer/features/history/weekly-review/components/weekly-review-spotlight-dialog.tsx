import { ArrowRight, BarChart3, CalendarDays, Sparkles } from "lucide-react";

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
        <DialogHeader className="pb-2">
          <div className="ui-eyebrow flex items-center gap-2 text-xs">
            <CalendarDays className="size-3.5" />
            Monday review
          </div>
          <DialogTitle>Weekly review is ready</DialogTitle>
          <DialogDescription>
            {`${review.label} has been added to your history. Open History and switch to the Weekly tab to see the full report.`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-background/80 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  View it in History
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  The weekly report lives in the History screen. Open it there
                  to browse the full summary and switch between weeks.
                </p>
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
