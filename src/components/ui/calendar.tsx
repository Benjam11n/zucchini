import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

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
          "flex size-12 items-center justify-center rounded-2xl text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
        disabled: "opacity-35",
        hidden: "invisible",
        month: "space-y-4",
        month_caption: "mb-4 flex items-center justify-between px-1",
        month_grid: "w-full border-collapse",
        months: "flex flex-col",
        nav: "flex items-center gap-2",
        outside: "text-muted-foreground/40",
        root: "w-full",
        selected: "bg-muted text-foreground",
        today: "text-foreground",
        week: "grid grid-cols-7",
        weekday:
          "pb-2 text-center text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground",
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
