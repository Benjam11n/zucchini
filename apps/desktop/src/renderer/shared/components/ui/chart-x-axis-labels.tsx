import {
  getAutoXAxisLabelGap,
  getVisibleXAxisLabels,
  getXAxisTextAnchor,
} from "@/renderer/shared/components/ui/chart-axis-utils";
import type { ChartXAxisLabelsProps } from "@/renderer/shared/components/ui/chart-axis-utils";

export function ChartXAxisLabels({
  labels,
  minLabelGap,
  size,
}: ChartXAxisLabelsProps) {
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
