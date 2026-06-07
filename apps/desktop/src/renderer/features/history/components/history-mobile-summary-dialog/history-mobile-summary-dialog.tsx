import { HistorySidebar } from "@/renderer/features/history/components/history-sidebar";
import type {
  HistoryMonthStats,
  HistoryTrendPoint,
} from "@/renderer/features/history/lib/history-timeline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/components/ui/dialog";
import type { HistorySummaryDay } from "@/shared/domain/history";

interface HistoryMobileSummaryDialogProps {
  monthStats: HistoryMonthStats;
  monthLabel: string;
  open: boolean;
  selectedDay: HistorySummaryDay | null;
  todayDate: string;
  trendPoints: HistoryTrendPoint[];
  onOpenChange: (open: boolean) => void;
}

export function HistoryMobileSummaryDialog({
  monthStats,
  monthLabel,
  open,
  selectedDay,
  todayDate,
  trendPoints,
  onOpenChange,
}: HistoryMobileSummaryDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[88vh] w-[min(92vw,24rem)] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>History day summary</DialogTitle>
          <DialogDescription>
            Selected day metrics and month trend.
          </DialogDescription>
        </DialogHeader>
        <div className="p-5">
          <HistorySidebar
            monthStats={monthStats}
            monthLabel={monthLabel}
            selectedDay={selectedDay}
            todayDate={todayDate}
            trendPoints={trendPoints}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
