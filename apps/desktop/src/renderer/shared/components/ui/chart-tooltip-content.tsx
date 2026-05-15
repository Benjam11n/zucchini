import type { ReactNode } from "react";

import { cn } from "@/renderer/shared/lib/class-names";

interface ChartTooltipContentProps {
  active?: boolean;
  className?: string;
  formatter?: (value: number | string, name: string) => ReactNode;
  indicator?: "dot" | "line";
  label?: string | undefined;
  payload?: {
    color?: string;
    dataKey?: string | number;
    name?: string;
    value?: number | string;
  }[];
}

export function ChartTooltipContent({
  active,
  className,
  formatter,
  indicator = "dot",
  label,
  payload,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "min-w-40 rounded-xl border border-border/70 bg-background/95 px-3 py-2 shadow-xl",
        className
      )}
    >
      {label ? <p className="ui-eyebrow mb-2 text-xs">{label}</p> : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const displayValue =
            formatter?.(item.value ?? 0, item.name ?? "") ??
            `${item.value ?? 0}`;

          return (
            <div
              className="flex items-center justify-between gap-3 text-sm"
              key={item.dataKey?.toString() ?? item.name}
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
