import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import type { InsightsSmartInsight } from "@/shared/domain/insights";

import { SmartInsightRow } from "./smart-insight-row";

export function SmartInsightsCard({
  insights,
}: {
  insights: InsightsSmartInsight[];
}) {
  return (
    <Card className="min-h-[310px]">
      <CardHeader>
        <CardTitle>Smart insights</CardTitle>
        <CardDescription>Small patterns worth acting on</CardDescription>
      </CardHeader>
      <CardContent className="grid content-start">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <SmartInsightRow insight={insight} key={insight.title} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            More history will unlock trend insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
