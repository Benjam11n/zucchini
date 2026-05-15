import { RefreshCw } from "lucide-react";

import type { InsightsPageProps } from "@/renderer/features/insights/insights.types";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";

export function InsightsErrorState({
  error,
  onRetryLoad,
}: Pick<InsightsPageProps, "error" | "onRetryLoad">) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-destructive">
            Insights failed to load.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message ?? "Try refreshing the dashboard."}
          </p>
        </div>
        <Button onClick={onRetryLoad} size="sm" type="button" variant="outline">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
