import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/renderer/shared/lib/class-names";

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        button_next:
          "inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted",
        button_previous:
          "inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted",
        caption_label: "text-sm font-semibold tracking-tight text-foreground",
        day: "p-1 text-center align-middle",
        day_button:
          "flex size-12 items-center justify-center rounded-xl text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
        disabled: "opacity-35",
        hidden: "invisible",
        month: "space-y-4",
        month_caption: "mb-4 pt-1 flex items-center px-1",
        month_grid: "w-full border-collapse",
        months: "flex flex-col",
        nav: "absolute right-4 top-4 flex items-center gap-2 z-10",
        outside: "text-muted-foreground/40",
        root: "relative w-full",
        selected: "rounded-xl bg-muted/50 text-foreground",
        today: "text-foreground",
        week: "grid grid-cols-7",
        weekday: "ui-eyebrow pb-2 text-center",
        weekdays: "grid grid-cols-7",
        weeks: "space-y-1",
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClassName, orientation, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft
              className={cn("size-4", iconClassName)}
              {...iconProps}
            />
          ) : (
            <ChevronRight
              className={cn("size-4", iconClassName)}
              {...iconProps}
            />
          ),
        ...components,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}

export { Calendar };
