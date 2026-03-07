import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DailySummary } from "../../shared/domain/streak";

interface HistoryPageProps {
  history: DailySummary[];
}

export function HistoryPage({ history }: HistoryPageProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardDescription>History</CardDescription>
          <CardTitle>Recent days</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {history.map((day) => (
          <Card key={day.date}>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <strong className="text-base font-semibold">{day.date}</strong>
                <p className="text-sm text-muted-foreground">
                  {day.allCompleted ? "Completed" : "Incomplete"} · Streak after
                  day: {day.streakCountAfterDay}
                </p>
              </div>
              <Badge variant={day.freezeUsed ? "secondary" : "outline"}>
                {day.freezeUsed ? "Freeze used" : "No freeze"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
