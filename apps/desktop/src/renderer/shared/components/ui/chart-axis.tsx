import { getPercentChartY } from "@/renderer/shared/components/ui/chart-geometry";
import { ChartLinearRightYAxis } from "@/renderer/shared/components/ui/chart-linear-right-y-axis";
import { ChartXAxisLabels } from "@/renderer/shared/components/ui/chart-x-axis-labels";

import type { ChartPadding, ChartSize } from "./chart-types";

interface ChartPercentYAxisProps {
  formatTick: (tick: number) => string;
  padding: ChartPadding;
  size: ChartSize;
  ticks: readonly number[];
}

export function ChartPercentYAxis({
  formatTick,
  padding,
  size,
  ticks,
}: ChartPercentYAxisProps) {
  return (
    <g className="text-muted-foreground text-[11px]">
      {ticks.map((tick) => {
        const y = getPercentChartY({ padding, size, value: tick });

        return (
          <g key={tick}>
            <line
              stroke="var(--border)"
              strokeDasharray="3 3"
              x1={padding.left}
              x2={size.width - padding.right}
              y1={y}
              y2={y}
            />
            <text
              dominantBaseline="middle"
              fill="currentColor"
              textAnchor="end"
              x={padding.left - 10}
              y={y}
            >
              {formatTick(tick)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export { ChartLinearRightYAxis, ChartXAxisLabels };
