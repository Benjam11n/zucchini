import { Activity, Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { Sparkline } from "@/renderer/shared/components/ui/sparkline";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import type { InsightsDashboard } from "@/shared/domain/insights";

export function MomentumCard({ dashboard }: { dashboard: InsightsDashboard }) {
  return (
    <Card className="min-h-[310px]">
      <CardHeader>
        <div>
          <CardTitle className="inline-flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Momentum
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  aria-label="Momentum score details"
                  className="size-3.5 text-muted-foreground"
                  role="img"
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-72 leading-relaxed">
                Momentum combines current completion rate, change vs the
                previous period, and current streak.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>{dashboard.momentum.label}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid justify-items-center gap-5">
        <div
          className="relative grid size-44 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) 0deg, var(--primary) ${
              dashboard.momentum.score * 3.6
            }deg, var(--muted) ${dashboard.momentum.score * 3.6}deg)`,
          }}
        >
          <div className="grid size-36 place-items-center rounded-full bg-card">
            <div className="text-center">
              <div className="text-5xl font-semibold tracking-tight tabular-nums">
                {dashboard.momentum.score}
              </div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>
          </div>
        </div>
        <div className="w-full text-primary">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Sparkline points={dashboard.momentum.sparkline} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Trend: {dashboard.momentum.sparkline.join("%, ")}%
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
