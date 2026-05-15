import { Activity, RefreshCw } from "lucide-react";

import { RangeSelector } from "@/renderer/features/insights/components/range-selector";
import type { InsightsPageProps } from "@/renderer/features/insights/insights.types";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";

export function InsightsEmptyState({
  onRetryLoad,
  onSelectRangeDays,
  rangeDays,
}: Pick<InsightsPageProps, "onRetryLoad" | "onSelectRangeDays" | "rangeDays">) {
  return (
    <Card className="border-dashed">
      <CardContent className="grid justify-items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Activity className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">No insights yet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Complete habits or record focus sessions for a few days to unlock
            the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <RangeSelector
            onSelectRangeDays={onSelectRangeDays}
            rangeDays={rangeDays}
          />
          <Button
            onClick={onRetryLoad}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
