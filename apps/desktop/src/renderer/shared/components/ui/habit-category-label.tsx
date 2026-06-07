export function HabitCategoryLabel({
  accentTextColor,
  label,
  showCategory,
}: {
  accentTextColor: string;
  label: string;
  showCategory?: boolean | undefined;
}) {
  if (!showCategory) {
    return null;
  }

  return (
    <span
      className="shrink-0 text-[0.68rem] uppercase tracking-wide opacity-80"
      style={{ color: accentTextColor }}
    >
      {label}
    </span>
  );
}
