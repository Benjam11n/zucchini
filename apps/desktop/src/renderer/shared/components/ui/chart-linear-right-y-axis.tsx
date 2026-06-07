import { getLinearChartY } from "@/renderer/shared/components/ui/chart-geometry";
import type {
  ChartPadding,
  ChartSize,
} from "@/renderer/shared/components/ui/chart-types";

interface ChartLinearRightYAxisProps {
  max: number;
  padding: ChartPadding;
  size: ChartSize;
  ticks: readonly number[];
}

export function ChartLinearRightYAxis({
  max,
  padding,
  size,
  ticks,
}: ChartLinearRightYAxisProps) {
  return (
    <g className="text-muted-foreground text-[11px]">
      {ticks.map((tick) => (
        <text
          dominantBaseline="middle"
          fill="currentColor"
          key={tick}
          textAnchor="start"
          x={size.width - padding.right + 10}
          y={getLinearChartY({ max, padding, size, value: tick })}
        >
          {tick}
        </text>
      ))}
    </g>
  );
}
