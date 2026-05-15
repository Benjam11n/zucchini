import { cn } from "@/renderer/shared/lib/class-names";

interface SparklineProps {
  ariaLabel?: string;
  className?: string;
  height?: number;
  points: number[];
  width?: number;
}

export function Sparkline({
  ariaLabel,
  className,
  height = 44,
  points,
  width = 180,
}: SparklineProps) {
  const safePoints =
    points.length > 1 ? points : [points.at(0) ?? 0, points.at(0) ?? 0];
  const polyline = safePoints
    .map((point, index) => {
      const x =
        safePoints.length === 1
          ? width
          : (index / (safePoints.length - 1)) * width;
      const y = height - (Math.max(0, Math.min(100, point)) / 100) * height;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={cn("h-12 w-full overflow-visible", className)}
      preserveAspectRatio="none"
      role={ariaLabel ? "img" : undefined}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        points={polyline}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
