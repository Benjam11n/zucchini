import type { ElementType } from "react";

interface SidebarMetricProps {
  icon: ElementType;
  label: string;
  value: string;
}

export function SidebarMetric({
  icon: Icon,
  label,
  value,
}: SidebarMetricProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
