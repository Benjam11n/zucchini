import { Badge } from "@/renderer/shared/components/ui/badge";
import { cn } from "@/renderer/shared/lib/class-names";
import type { InsightsSmartInsight } from "@/shared/domain/insights";

export function SmartInsightRow({
  insight,
}: {
  insight: InsightsSmartInsight;
}) {
  let severityLabel = "Note";
  if (insight.severity === "warning") {
    severityLabel = "Watch";
  } else if (insight.severity === "positive") {
    severityLabel = "Strong";
  }

  return (
    <div className="grid gap-2 border-b border-border/70 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            "h-5 rounded border px-1.5 py-0 text-[0.68rem] font-medium uppercase tracking-wide",
            insight.severity === "warning"
              ? "border-amber-500/35 bg-amber-500/8 text-amber-600"
              : "border-primary/25 bg-primary/8 text-primary"
          )}
          variant="outline"
        >
          {severityLabel}
        </Badge>
        <p className="min-w-0 truncate font-medium text-foreground">
          {insight.title}
        </p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{insight.body}</p>
    </div>
  );
}
