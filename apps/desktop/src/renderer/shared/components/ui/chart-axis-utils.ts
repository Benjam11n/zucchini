import type { ChartSize } from "@/renderer/shared/components/ui/chart-types";

export interface ChartXAxisLabel {
  id: string | number;
  label: string;
  x: number;
}

const X_AXIS_LABEL_CHARACTER_WIDTH = 7;
const X_AXIS_LABEL_HORIZONTAL_PADDING = 20;
const X_AXIS_MAX_AUTO_LABEL_GAP = 148;
const X_AXIS_MIN_AUTO_LABEL_GAP = 56;

export function getAutoXAxisLabelGap(labels: ChartXAxisLabel[]): number {
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

export function getVisibleXAxisLabels(
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

export function getXAxisTextAnchor(
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

export interface ChartXAxisLabelsProps {
  labels: ChartXAxisLabel[];
  minLabelGap?: number | undefined;
  size: ChartSize;
}
