import { cn } from "@/renderer/shared/lib/class-names";

interface ChartLegendProps {
  className?: string;
  items: {
    color: string;
    label: string;
  }[];
}

export function ChartLegend({ className, items }: ChartLegendProps) {
  return (
    <div
      aria-label="Chart legend"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs",
        className
      )}
    >
      {items.map((item) => (
        <div className="flex items-center gap-1.5" key={item.label}>
          <span
            className="h-1.5 w-5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
