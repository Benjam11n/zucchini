import { Sparkline } from "@/renderer/shared/components/ui/sparkline";
import { cn } from "@/renderer/shared/lib/class-names";
import type { InsightsSummaryMetric } from "@/shared/domain/insights";

interface SummaryMetricCardProps {
  metric: InsightsSummaryMetric;
}

export function SummaryMetricCard({ metric }: SummaryMetricCardProps) {
  const isPositive = metric.deltaLabel.startsWith("+");

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2 border-border/70 px-3 py-2 first:pl-0 last:pr-0 lg:border-l lg:first:border-l-0">
      <div className="grid min-w-0 gap-0.5">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {metric.value}
          </span>
          <span className="truncate text-xs font-medium text-foreground">
            {metric.label}
          </span>
        </div>
        <p
          className={cn(
            "truncate text-xs",
            isPositive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {metric.deltaLabel}
        </p>
      </div>
      <div className="w-14 text-primary/80">
        <Sparkline className="h-4" points={metric.trend} />
      </div>
    </div>
  );
}
