import type { CSSProperties } from "react";

import type { ChartPadding, ChartPoint, ChartSize } from "./chart-types";

export function getChartPlotWidth(
  size: ChartSize,
  padding: ChartPadding
): number {
  return size.width - padding.left - padding.right;
}

export function getChartX({
  count,
  index,
  padding,
  size,
}: {
  count: number;
  index: number;
  padding: ChartPadding;
  size: ChartSize;
}): number {
  const plotWidth = getChartPlotWidth(size, padding);

  if (count <= 1) {
    return padding.left + plotWidth / 2;
  }

  return padding.left + (plotWidth / (count - 1)) * index;
}

export function getChartSlotX({
  count,
  index,
  padding,
  size,
}: {
  count: number;
  index: number;
  padding: ChartPadding;
  size: ChartSize;
}): number {
  if (count <= 0) {
    return padding.left;
  }

  return (
    padding.left + (getChartPlotWidth(size, padding) / count) * (index + 0.5)
  );
}

export function getPercentChartY({
  padding,
  size,
  value,
}: {
  padding: ChartPadding;
  size: ChartSize;
  value: number;
}): number {
  const boundedValue = Math.max(0, Math.min(100, value));
  const plotHeight = size.height - padding.top - padding.bottom;

  return padding.top + plotHeight - (boundedValue / 100) * plotHeight;
}

export function getLinearChartY({
  max,
  padding,
  size,
  value,
}: {
  max: number;
  padding: ChartPadding;
  size: ChartSize;
  value: number;
}): number {
  const plotHeight = size.height - padding.top - padding.bottom;
  const scaleMax = Math.max(1, max);

  return padding.top + plotHeight - (value / scaleMax) * plotHeight;
}

export function getAnchoredChartTooltipStyle(
  point: ChartPoint | null
): CSSProperties | undefined {
  if (!point) {
    return;
  }

  return {
    left: point.x,
    top: point.y,
    transform:
      point.y < 72
        ? "translate(-50%, 0.75rem)"
        : "translate(-50%, calc(-100% - 0.75rem))",
  };
}

function getSegment(points: ChartPoint[], index: number) {
  const point = points[index] as ChartPoint;
  const nextPoint = points[index + 1] as ChartPoint;

  return {
    deltaX: nextPoint.x - point.x,
    nextPoint,
    point,
  };
}

export function getMonotoneChartPath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0] as ChartPoint;

    return `M ${point.x} ${point.y}`;
  }

  const slopes: number[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const { deltaX, nextPoint, point } = getSegment(points, index);

    slopes.push(deltaX === 0 ? 0 : (nextPoint.y - point.y) / deltaX);
  }

  const tangents: number[] = [];

  for (const [index] of points.entries()) {
    if (index === 0) {
      tangents.push(slopes[0] ?? 0);
      continue;
    }

    if (index === points.length - 1) {
      tangents.push(slopes.at(-1) ?? 0);
      continue;
    }

    const previousSlope = slopes[index - 1] ?? 0;
    const nextSlope = slopes[index] ?? 0;

    tangents.push(
      previousSlope * nextSlope <= 0 ? 0 : (previousSlope + nextSlope) / 2
    );
  }

  const firstPoint = points[0] as ChartPoint;
  let path = `M ${firstPoint.x} ${firstPoint.y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const { deltaX, nextPoint, point } = getSegment(points, index);
    const controlPointOne = {
      x: point.x + deltaX / 3,
      y: point.y + (tangents[index] ?? 0) * (deltaX / 3),
    };
    const controlPointTwo = {
      x: nextPoint.x - deltaX / 3,
      y: nextPoint.y - (tangents[index + 1] ?? 0) * (deltaX / 3),
    };

    path = `${path} C ${controlPointOne.x} ${controlPointOne.y}, ${controlPointTwo.x} ${controlPointTwo.y}, ${nextPoint.x} ${nextPoint.y}`;
  }

  return path;
}
