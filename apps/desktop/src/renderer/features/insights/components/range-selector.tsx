import { Button } from "@/renderer/shared/components/ui/button";
import type { InsightsRangeDays } from "@/shared/domain/insights";
import { INSIGHTS_RANGE_OPTIONS } from "@/shared/domain/insights";

const RANGE_LABELS: Record<InsightsRangeDays, string> = {
  180: "180d",
  30: "30d",
  365: "1y",
  7: "7d",
  90: "90d",
};

interface RangeSelectorProps {
  rangeDays: InsightsRangeDays;
  onSelectRangeDays: (rangeDays: InsightsRangeDays) => void;
}

export function RangeSelector({
  rangeDays,
  onSelectRangeDays,
}: RangeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
      {INSIGHTS_RANGE_OPTIONS.map((option) => (
        <Button
          aria-pressed={rangeDays === option}
          className="h-7 rounded-md px-2 text-xs"
          key={option}
          onClick={() => onSelectRangeDays(option)}
          type="button"
          variant={rangeDays === option ? "secondary" : "ghost"}
        >
          {RANGE_LABELS[option]}
        </Button>
      ))}
    </div>
  );
}
