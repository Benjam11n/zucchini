import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
  progress: number;
  dateLabel: string;
  totalHabits: number;
  completedHabits: number;
}

function getStatusCopy(progress: number): string {
  if (progress === 100) {
    return "All habits complete. Streak secured.";
  }

  if (progress > 0) {
    return "Keep it alive. You're partway there.";
  }

  return "Start today strong.";
}

export function StreakCard({
  currentStreak,
  bestStreak,
  progress,
  dateLabel,
  totalHabits,
  completedHabits,
}: StreakCardProps) {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="gap-4 border-none pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardDescription className="text-[0.7rem] font-semibold tracking-[0.24em] uppercase text-foreground/65">
              Current streak
            </CardDescription>
            <div className="flex items-start gap-3">
              <span className="font-sans text-7xl leading-none font-black tracking-tight text-foreground sm:text-8xl">
                {currentStreak}
              </span>
              <span className="pt-3 text-sm font-semibold tracking-[0.18em] uppercase text-muted-foreground sm:pt-4">
                days
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Best: {bestStreak} days
            </p>
          </div>

          <Card
            className="min-w-[220px] border-border/70 bg-muted/50 py-0 shadow-none"
            size="sm"
          >
            <CardContent className="flex flex-col items-start gap-3 py-3">
              <CardTitle className="sr-only">Daily progress</CardTitle>
              <Badge className="px-3 py-1 text-[0.7rem] font-bold tracking-[0.16em] uppercase">
                {progress}% complete
              </Badge>
              <p className="text-sm leading-6 font-medium text-foreground">
                {getStatusCopy(progress)}
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{dateLabel}</p>
                <p>
                  {completedHabits} of {totalHabits} habits finished today
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="space-y-3">
          <Progress value={progress} />
          <p className="max-w-2xl text-sm leading-6 text-foreground/72">
            Show up for the checklist below and protect the number that matters
            most.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
