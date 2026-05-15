import {
  getLinearChartY,
  getPercentChartY,
} from "@/renderer/shared/components/ui/chart-geometry";

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

interface ChartXAxisLabel {
  id: string | number;
  label: string;
  x: number;
}

const X_AXIS_LABEL_CHARACTER_WIDTH = 7;
const X_AXIS_LABEL_HORIZONTAL_PADDING = 20;
const X_AXIS_MAX_AUTO_LABEL_GAP = 148;
const X_AXIS_MIN_AUTO_LABEL_GAP = 56;

function getAutoXAxisLabelGap(labels: ChartXAxisLabel[]): number {
  if (labels.length <= 2) {
    return 0;
  }

  const longestLabelLength = Math.max(
    0,
    ...labels.map((label) => label.label.length)
  );

  return Math.max(
    X_AXIS_MIN_AUTO_LABEL_GAP,
    Math.min(
      X_AXIS_MAX_AUTO_LABEL_GAP,
      longestLabelLength * X_AXIS_LABEL_CHARACTER_WIDTH +
        X_AXIS_LABEL_HORIZONTAL_PADDING
    )
  );
}

function getVisibleXAxisLabels(
  labels: ChartXAxisLabel[],
  minLabelGap: number
): ChartXAxisLabel[] {
  if (minLabelGap <= 0 || labels.length <= 2) {
    return labels;
  }

  const visibleLabels: ChartXAxisLabel[] = [];
  const lastLabel = labels.at(-1);
  let previousX = Number.NEGATIVE_INFINITY;

  for (const [index, label] of labels.entries()) {
    if (index === labels.length - 1) {
      continue;
    }

    if (label.x - previousX >= minLabelGap) {
      visibleLabels.push(label);
      previousX = label.x;
    }
  }

  if (!lastLabel) {
    return visibleLabels;
  }

  while (visibleLabels.length > 0) {
    const previousLabel = visibleLabels.at(-1);

    if (!previousLabel || lastLabel.x - previousLabel.x >= minLabelGap) {
      break;
    }

    visibleLabels.pop();
  }

  return [...visibleLabels, lastLabel];
}

function getXAxisTextAnchor(
  label: ChartXAxisLabel,
  labels: ChartXAxisLabel[]
): "end" | "middle" | "start" {
  if (label.id === labels[0]?.id) {
    return "start";
  }

  if (label.id === labels.at(-1)?.id) {
    return "end";
  }

  return "middle";
}

export function ChartXAxisLabels({
  labels,
  minLabelGap,
  size,
}: {
  labels: ChartXAxisLabel[];
  minLabelGap?: number | undefined;
  size: ChartSize;
}) {
  const visibleLabels = getVisibleXAxisLabels(
    labels,
    minLabelGap ?? getAutoXAxisLabelGap(labels)
  );

  return (
    <>
      {visibleLabels.map((label) => (
        <text
          fill="var(--muted-foreground)"
          fontSize={12}
          key={label.id}
          textAnchor={getXAxisTextAnchor(label, labels)}
          x={label.x}
          y={size.height - 7}
        >
          {label.label}
        </text>
      ))}
    </>
  );
}
