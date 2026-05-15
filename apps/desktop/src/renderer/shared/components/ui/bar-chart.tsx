import { useState } from "react";
import type { ReactNode } from "react";

import {
  getAnchoredChartTooltipStyle,
  getChartPlotWidth,
  getChartSlotX,
  getPercentChartY,
} from "@/renderer/shared/components/ui/chart-geometry";
import { ChartSvgFrame } from "@/renderer/shared/components/ui/chart-svg-frame";

import { ChartPercentYAxis, ChartXAxisLabels } from "./chart-axis";
import type {
  ChartPadding,
  ChartSize,
  ChartTooltipRenderState,
} from "./chart-types";

interface ChartBarDatum {
  ariaLabel: string;
  id: string | number;
  label: string;
  tooltipLabel?: string;
  value: number | null;
}

interface ChartBarSeriesProps {
  color: string;
  data: ChartBarDatum[];
  "data-testid"?: string | undefined;
  onActiveIndexChange: (index: number | null) => void;
  padding: ChartPadding;
  radius?: number;
  size: ChartSize;
}

function ChartBarSeries({
  color,
  data,
  "data-testid": dataTestId,
  onActiveIndexChange,
  padding,
  radius = 8,
  size,
}: ChartBarSeriesProps) {
  const slotWidth =
    data.length > 0 ? getChartPlotWidth(size, padding) / data.length : 0;
  const barWidth = Math.max(18, Math.min(42, slotWidth * 0.58));
  const baselineY = getPercentChartY({ padding, size, value: 0 });

  return (
    <>
      {data.map((item, index) => {
        if (item.value === null) {
          return null;
        }

        const centerX = getChartSlotX({
          count: data.length,
          index,
          padding,
          size,
        });
        const y = getPercentChartY({ padding, size, value: item.value });

        return (
          <rect
            aria-label={item.ariaLabel}
            data-testid={dataTestId}
            fill={color}
            height={baselineY - y}
            key={item.id}
            onBlur={() => onActiveIndexChange(null)}
            onFocus={() => onActiveIndexChange(index)}
            onMouseEnter={() => onActiveIndexChange(index)}
            onMouseLeave={() => onActiveIndexChange(null)}
            role="img"
            rx={radius}
            tabIndex={0}
            width={barWidth}
            x={centerX - barWidth / 2}
            y={y}
          />
        );
      })}
    </>
  );
}

interface BarChartProps {
  ariaLabel: string;
  barColor: string;
  barTestId?: string;
  data: ChartBarDatum[];
  defaultSize: ChartSize;
  padding: ChartPadding;
  renderTooltip?: (state: ChartTooltipRenderState<ChartBarDatum>) => ReactNode;
  yAxis: {
    formatTick: (tick: number) => string;
    ticks: readonly number[];
  };
}

export function BarChart({
  ariaLabel,
  barColor,
  barTestId,
  data,
  defaultSize,
  padding,
  renderTooltip,
  yAxis,
}: BarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeDatum = activeIndex === null ? null : (data[activeIndex] ?? null);

  return (
    <ChartSvgFrame
      ariaLabel={ariaLabel}
      defaultSize={defaultSize}
      overlay={({ size }) => {
        const activeTooltip =
          activeIndex === null ||
          activeDatum === null ||
          activeDatum.value === null
            ? null
            : {
                x: getChartSlotX({
                  count: data.length,
                  index: activeIndex,
                  padding,
                  size,
                }),
                y: getPercentChartY({
                  padding,
                  size,
                  value: activeDatum.value,
                }),
              };

        return renderTooltip?.({
          activeDatum,
          activeIndex,
          style: getAnchoredChartTooltipStyle(activeTooltip),
        });
      }}
    >
      {({ size }) => (
        <>
          <ChartPercentYAxis
            formatTick={yAxis.formatTick}
            padding={padding}
            size={size}
            ticks={yAxis.ticks}
          />
          <ChartBarSeries
            color={barColor}
            data={data}
            data-testid={barTestId}
            onActiveIndexChange={setActiveIndex}
            padding={padding}
            size={size}
          />
          <ChartXAxisLabels
            labels={data.map((datum, index) => ({
              id: datum.id,
              label: datum.label,
              x: getChartSlotX({
                count: data.length,
                index,
                padding,
                size,
              }),
            }))}
            size={size}
          />
        </>
      )}
    </ChartSvgFrame>
  );
}
