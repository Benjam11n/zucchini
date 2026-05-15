import type { CSSProperties } from "react";

export type ChartConfig = Record<
  string,
  {
    color: string;
    label: string;
  }
>;

export interface ChartSize {
  height: number;
  width: number;
}

export interface ChartPadding {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartTooltipRenderState<Datum> {
  activeDatum: Datum | null;
  activeIndex: number | null;
  style: CSSProperties | undefined;
}
