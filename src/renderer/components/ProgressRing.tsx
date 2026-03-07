import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface ProgressRingProps {
  progress: number;
}

export function ProgressRing({ progress }: ProgressRingProps) {
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="rounded-[2rem] shadow-sm">
      <CardContent className="flex flex-col justify-between gap-6 px-6 py-5 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <CardDescription className="text-xs font-medium tracking-[0.24em] uppercase">
            Progress
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            {progress}% complete
          </CardTitle>
        </div>

        <svg className="size-28 shrink-0" viewBox="0 0 120 120">
          <circle
            className="fill-none stroke-border stroke-[10]"
            cx="60"
            cy="60"
            r="52"
          />
          <circle
            className="fill-none stroke-primary stroke-[10]"
            cx="60"
            cy="60"
            r="52"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
          />
          <text
            className="fill-foreground text-base font-semibold"
            dominantBaseline="middle"
            textAnchor="middle"
            x="50%"
            y="50%"
          >
            {progress}%
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
