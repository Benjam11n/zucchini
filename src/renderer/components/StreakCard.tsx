import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

export function StreakCard({ currentStreak, bestStreak }: StreakCardProps) {
  return (
    <Card className="rounded-[2rem] shadow-sm">
      <CardHeader className="pb-0">
        <CardDescription className="text-xs font-medium tracking-[0.24em] uppercase">
          Streak
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <CardTitle className="text-4xl font-semibold tracking-tight">
          {currentStreak} days
        </CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Best: {bestStreak} days
        </p>
      </CardContent>
    </Card>
  );
}
