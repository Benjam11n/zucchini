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
    <Card>
      <CardHeader className="pb-0">
        <CardDescription>Streak</CardDescription>
      </CardHeader>
      <CardContent>
        <CardTitle>{currentStreak} days</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Best: {bestStreak} days
        </p>
      </CardContent>
    </Card>
  );
}
