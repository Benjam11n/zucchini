import { useState } from "react";
import type { ReactNode } from "react";

import {
  getAnchoredChartTooltipStyle,
  getChartX,
  getLinearChartY,
  getMonotoneChartPath,
  getPercentChartY,
} from "@/renderer/shared/components/ui/chart-geometry";
import { ChartSvgFrame } from "@/renderer/shared/components/ui/chart-svg-frame";

import {
  ChartLinearRightYAxis,
  ChartPercentYAxis,
  ChartXAxisLabels,
} from "./chart-axis";
import type {
  ChartPadding,
  ChartPoint,
  ChartSize,
  ChartTooltipRenderState,
} from "./chart-types";

interface ChartLineSeriesProps {
  color: string;
  "data-testid"?: string | undefined;
  points: ChartPoint[];
}

function ChartLineSeries({
  color,
  "data-testid": dataTestId,
  points,
}: ChartLineSeriesProps) {
  return (
    <path
      d={getMonotoneChartPath(points)}
      data-testid={dataTestId}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
    />
  );
}

interface ChartPointMarkersProps {
  color: string;
  data: { ariaLabel: string; id: string | number; point: ChartPoint }[];
  "data-testid"?: string | undefined;
  onActiveIndexChange: (index: number | null) => void;
}

function ChartPointMarkers({
  color,
  data,
  "data-testid": dataTestId,
  onActiveIndexChange,
}: ChartPointMarkersProps) {
  return (
    <>
      {data.map((item, index) => (
        <circle
          aria-label={item.ariaLabel}
          cx={item.point.x}
          cy={item.point.y}
          data-testid={dataTestId}
          fill={color}
          key={item.id}
          onBlur={() => onActiveIndexChange(null)}
          onFocus={() => onActiveIndexChange(index)}
          onMouseEnter={() => onActiveIndexChange(index)}
          onMouseLeave={() => onActiveIndexChange(null)}
          r={4}
          role="img"
          tabIndex={0}
        />
      ))}
    </>
  );
}

interface LineChartDatum {
  id: string | number;
  label: string;
}

interface LineChartSeries<Datum extends LineChartDatum> {
  ariaLabel: (datum: Datum, value: number) => string;
  color: string;
  lineTestId?: string;
  markerTestId?: string;
  scale: "linear" | "percent";
  value: (datum: Datum) => number;
}

interface LineChartProps<Datum extends LineChartDatum> {
  ariaLabel: string;
  data: Datum[];
  defaultSize: ChartSize;
  linearScaleMax?: number;
  padding: ChartPadding;
  percentAxis: {
    formatTick: (tick: number) => string;
    ticks: readonly number[];
  };
  renderTooltip?: (state: ChartTooltipRenderState<Datum>) => ReactNode;
  rightAxis?: {
    ticks: readonly number[];
  };
  series: LineChartSeries<Datum>[];
  xAxis?: {
    minLabelGap?: number;
  };
}

export function LineChart<Datum extends LineChartDatum>({
  ariaLabel,
  data,
  defaultSize,
  linearScaleMax = 0,
  padding,
  percentAxis,
  renderTooltip,
  rightAxis,
  series,
  xAxis,
}: LineChartProps<Datum>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeDatum = activeIndex === null ? null : (data[activeIndex] ?? null);

  return (
    <ChartSvgFrame
      ariaLabel={ariaLabel}
      defaultSize={defaultSize}
      overlay={({ size }) => {
        let activeTooltip: ChartPoint | null = null;

        if (activeIndex !== null) {
          const datum = data[activeIndex];

          if (datum) {
            for (const chartSeries of series) {
              const point = {
                x: getChartX({
                  count: data.length,
                  index: activeIndex,
                  padding,
                  size,
                }),
                y:
                  chartSeries.scale === "percent"
                    ? getPercentChartY({
                        padding,
                        size,
                        value: chartSeries.value(datum),
                      })
                    : getLinearChartY({
                        max: linearScaleMax,
                        padding,
                        size,
                        value: chartSeries.value(datum),
                      }),
              };

              if (!activeTooltip || point.y < activeTooltip.y) {
                activeTooltip = point;
              }
            }
          }
        }

        return renderTooltip?.({
          activeDatum,
          activeIndex,
          style: getAnchoredChartTooltipStyle(activeTooltip),
        });
      }}
    >
      {({ size }) => {
        const getX = (index: number) =>
          getChartX({
            count: data.length,
            index,
            padding,
            size,
          });
        const getSeriesY = (
          chartSeries: LineChartSeries<Datum>,
          datum: Datum
        ) =>
          chartSeries.scale === "percent"
            ? getPercentChartY({
                padding,
                size,
                value: chartSeries.value(datum),
              })
            : getLinearChartY({
                max: linearScaleMax,
                padding,
                size,
                value: chartSeries.value(datum),
              });

        return (
          <>
            <ChartPercentYAxis
              formatTick={percentAxis.formatTick}
              padding={padding}
              size={size}
              ticks={percentAxis.ticks}
            />
            {rightAxis ? (
              <ChartLinearRightYAxis
                max={linearScaleMax}
                padding={padding}
                size={size}
                ticks={rightAxis.ticks}
              />
            ) : null}
            {series.map((chartSeries) => {
              const points = data.map((datum, index) => ({
                x: getX(index),
                y: getSeriesY(chartSeries, datum),
              }));

              return (
                <ChartLineSeries
                  color={chartSeries.color}
                  data-testid={chartSeries.lineTestId}
                  key={`${chartSeries.color}-${chartSeries.lineTestId ?? ""}`}
                  points={points}
                />
              );
            })}
            <ChartXAxisLabels
              labels={data.map((datum, index) => ({
                id: datum.id,
                label: datum.label,
                x: getX(index),
              }))}
              minLabelGap={xAxis?.minLabelGap}
              size={size}
            />
            {series.map((chartSeries) => {
              const markerData = data.map((datum, index) => ({
                ariaLabel: chartSeries.ariaLabel(
                  datum,
                  chartSeries.value(datum)
                ),
                id: `${datum.id}-${chartSeries.markerTestId ?? chartSeries.color}`,
                point: {
                  x: getX(index),
                  y: getSeriesY(chartSeries, datum),
                },
              }));

              return (
                <ChartPointMarkers
                  color={chartSeries.color}
                  data={markerData}
                  data-testid={chartSeries.markerTestId}
                  key={`${chartSeries.color}-${chartSeries.markerTestId ?? ""}`}
                  onActiveIndexChange={setActiveIndex}
                />
              );
            })}
          </>
        );
      }}
    </ChartSvgFrame>
  );
}
