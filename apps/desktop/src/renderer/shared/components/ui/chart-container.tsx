import type * as React from "react";

import { cn } from "@/renderer/shared/lib/class-names";

import type { ChartConfig } from "./chart-types";

interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig;
}

export function ChartContainer({
  className,
  config,
  style,
  ...props
}: ChartContainerProps) {
  const chartStyle: Record<string, string> = {};

  for (const [index, [key, value]] of Object.entries(config).entries()) {
    chartStyle[`--color-${key}`] = value.color;
    chartStyle[`--chart-series-${index + 1}`] = value.color;
  }

  return (
    <div
      className={cn(
        "h-[260px] w-full rounded-xl border border-border/60 bg-background/50 p-3",
        className
      )}
      style={{ ...chartStyle, ...style }}
      {...props}
    />
  );
}
