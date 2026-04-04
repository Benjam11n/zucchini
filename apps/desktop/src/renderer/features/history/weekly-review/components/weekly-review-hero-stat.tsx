import type { LucideIcon } from "lucide-react";

interface WeeklyReviewHeroStatProps {
  icon: LucideIcon;
  label: string;
  value: number | string | null;
}

export function WeeklyReviewHeroStat({
  icon: Icon,
  label,
  value,
}: WeeklyReviewHeroStatProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <p className="ui-eyebrow text-[0.65rem]">{label}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">
        {value ?? "-"}
      </p>
    </div>
  );
}
