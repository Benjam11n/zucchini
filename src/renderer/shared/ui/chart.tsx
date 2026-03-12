import { Suspense, lazy } from "react";
import type * as React from "react";

import { cn } from "@/renderer/shared/lib/class-names";

export type ChartConfig = Record<
  string,
  {
    color: string;
    label: string;
  }
>;

interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig;
}

function ChartContainer({
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
        "h-[260px] w-full rounded-[24px] border border-border/60 bg-background/50 p-3",
        className
      )}
      style={{ ...chartStyle, ...style }}
      {...props}
    />
  );
}

interface ChartTooltipContentProps {
  className?: string;
  formatter?: (value: number | string, name: string) => React.ReactNode;
  indicator?: "dot" | "line";
}

interface ChartTooltipPayloadItem {
  color?: string;
  dataKey?: string | number;
  name?: string;
  value?: number | string;
}

interface ChartTooltipContentPrimitiveProps {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPayloadItem[];
}

interface ChartTooltipPrimitiveProps {
  active?: boolean;
  content?: React.ReactNode;
  cursor?: Record<string, unknown>;
}

interface ChartResponsiveContainerProps {
  children: React.ReactNode;
  height?: number | `${number}%`;
  width?: number | `${number}%`;
}

const RechartsResponsiveContainer = lazy(async () =>
  import("recharts").then((module) => ({
    default: module.ResponsiveContainer,
  }))
);

const RechartsTooltip = lazy(async () =>
  import("recharts").then((module) => ({
    default: module.Tooltip,
  }))
);

function ChartTooltipContent({
  active,
  className,
  formatter,
  indicator = "dot",
  label,
  payload,
}: ChartTooltipContentPrimitiveProps & ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "min-w-40 rounded-2xl border border-border/70 bg-background/95 px-3 py-2 shadow-xl",
        className
      )}
    >
      {label ? (
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] uppercase text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const displayValue =
            formatter?.(item.value ?? 0, item.name ?? "") ??
            `${item.value ?? 0}`;

          return (
            <div
              key={item.dataKey?.toString() ?? item.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <span
                  className={cn(
                    "shrink-0 rounded-full",
                    indicator === "dot" ? "size-2.5" : "h-0.5 w-3 rounded-none"
                  )}
                  style={{ backgroundColor: item.color ?? "currentColor" }}
                />
                <span>{item.name}</span>
              </div>
              <span className="font-semibold text-foreground">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartResponsiveContainer(props: ChartResponsiveContainerProps) {
  return (
    <Suspense fallback={<div className="h-full w-full" />}>
      <RechartsResponsiveContainer {...props} />
    </Suspense>
  );
}

function ChartTooltip(props: ChartTooltipPrimitiveProps) {
  const TooltipComponent = RechartsTooltip as React.ComponentType<any>;

  return (
    <Suspense fallback={null}>
      <TooltipComponent {...props} />
    </Suspense>
  );
}

export { ChartContainer, ChartTooltipContent };
export { ChartResponsiveContainer, ChartTooltip };
