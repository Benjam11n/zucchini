import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/renderer/shared/lib/class-names";

function Progress({
  className,
  indicatorClassName,
  indicatorStyle,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}) {
  const normalizedValue = Math.min(Math.max(value ?? 0, 0), 100);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      value={normalizedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 bg-primary transition-all",
          indicatorClassName
        )}
        style={{
          transform: `translateX(-${100 - normalizedValue}%)`,
          ...indicatorStyle,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
