import type { HistoryTrendPoint } from "@/renderer/features/history/lib/history-timeline";

interface TrendLineProps {
  points: HistoryTrendPoint[];
}

export function TrendLine({ points }: TrendLineProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 px-3 py-8 text-center text-xs text-muted-foreground">
        No trend yet
      </div>
    );
  }

  const getTrendCoordinate = (point: HistoryTrendPoint, index: number) => ({
    x:
      points.length === 1
        ? 100
        : Math.round((index / (points.length - 1)) * 200),
    y: Math.round(90 - point.percent * 0.8),
  });
  const path = points
    .map((point, index) => {
      const { x, y } = getTrendCoordinate(point, index);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-label="Completion trend"
      className="h-28 w-full overflow-visible"
      role="img"
      viewBox="0 0 200 100"
    >
      {[10, 30, 50, 70, 90].map((y) => (
        <line
          className="stroke-border/70"
          key={y}
          strokeDasharray="4 4"
          x1="0"
          x2="200"
          y1={y}
          y2={y}
        />
      ))}
      <path
        className="stroke-primary"
        d={path}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      {points.map((point, index) => {
        const { x, y } = getTrendCoordinate(point, index);

        return (
          <circle
            className="fill-background stroke-primary"
            cx={x}
            cy={y}
            key={point.date}
            r={index === points.length - 1 ? 3.5 : 2.5}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
