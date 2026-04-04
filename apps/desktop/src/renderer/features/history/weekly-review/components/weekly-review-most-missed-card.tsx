import { ArrowDownRight } from "lucide-react";

import { Badge } from "@/renderer/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import type { WeeklyReviewHabitMetric } from "@/shared/domain/weekly-review";

interface WeeklyReviewMostMissedCardProps {
  habits: WeeklyReviewHabitMetric[];
}

export function WeeklyReviewMostMissedCard({
  habits,
}: WeeklyReviewMostMissedCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most missed habits</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {habits.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 bg-background/40 px-4 py-6 text-sm text-muted-foreground">
            No misses last week. Keep the rhythm.
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.habitId}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/45 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{habit.name}</p>
                <p className="text-sm text-muted-foreground">
                  {habit.missedOpportunities} missed of {habit.opportunities}{" "}
                  opportunities
                </p>
              </div>
              <Badge variant="outline">
                <ArrowDownRight className="size-3.5" />
                {habit.completionRate}%
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
