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
  nextDateKey: string | null;
  open: boolean;
  previousDateKey: string | null;
  selectedDay: HistorySummaryDay | null;
  todayDate: string;
  trendPoints: HistoryTrendPoint[];
  onOpenChange: (open: boolean) => void;
  onSelectDate: (dateKey: string) => void;
}

export function HistoryMobileSummaryDialog({
  monthStats,
  nextDateKey,
  open,
  previousDateKey,
  selectedDay,
  todayDate,
  trendPoints,
  onOpenChange,
  onSelectDate,
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
            nextDateKey={nextDateKey}
            previousDateKey={previousDateKey}
            selectedDay={selectedDay}
            todayDate={todayDate}
            trendPoints={trendPoints}
            onSelectDate={onSelectDate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
