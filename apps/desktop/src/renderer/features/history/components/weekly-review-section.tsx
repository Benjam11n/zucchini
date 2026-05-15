import type { HistoryPageProps } from "@/renderer/features/history/history.types";
import { WeeklyReviewDailyCadenceChart } from "@/renderer/features/history/weekly-review/components/weekly-review-daily-cadence-chart";
import { WeeklyReviewHabitChart } from "@/renderer/features/history/weekly-review/components/weekly-review-habit-chart";
import { WeeklyReviewHeroCard } from "@/renderer/features/history/weekly-review/components/weekly-review-hero-card";
import { WeeklyReviewMostMissedCard } from "@/renderer/features/history/weekly-review/components/weekly-review-most-missed-card";
import { WeeklyReviewTrendChart } from "@/renderer/features/history/weekly-review/components/weekly-review-trend-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { Spinner } from "@/renderer/shared/components/ui/spinner";

export function WeeklyReviewSection({
  onSelectWeeklyReview,
  selectedWeeklyReview,
  weeklyReviewError,
  weeklyReviewOverview,
  weeklyReviewPhase,
}: Pick<
  HistoryPageProps,
  | "onSelectWeeklyReview"
  | "selectedWeeklyReview"
  | "weeklyReviewError"
  | "weeklyReviewOverview"
  | "weeklyReviewPhase"
>) {
  const review =
    selectedWeeklyReview ?? weeklyReviewOverview?.latestReview ?? null;

  if (
    (weeklyReviewPhase === "idle" || weeklyReviewPhase === "loading") &&
    !review
  ) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
          <Spinner className="size-4 text-primary/70" />
          Building weekly review…
        </CardContent>
      </Card>
    );
  }

  if (!review) {
    if (weeklyReviewError) {
      return (
        <Card>
          <CardHeader>
            <CardDescription>Weekly Review</CardDescription>
            <CardTitle>Could not load weekly review</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {weeklyReviewError.message}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardDescription>Weekly Review</CardDescription>
          <CardTitle>Not enough history yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Finish a full Monday-Sunday cycle to unlock weekly review cards and
          charts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {weeklyReviewError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {weeklyReviewError.message}
        </div>
      ) : null}

      <WeeklyReviewHeroCard
        availableWeeks={weeklyReviewOverview?.availableWeeks ?? []}
        isLoading={weeklyReviewPhase === "loading"}
        onSelectWeek={onSelectWeeklyReview}
        review={review}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <WeeklyReviewDailyCadenceChart review={review} />
        <WeeklyReviewTrendChart trend={weeklyReviewOverview?.trend ?? []} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <WeeklyReviewHabitChart heatmapRows={review.habitHeatmapRows} />
        <WeeklyReviewMostMissedCard habits={review.mostMissedHabits} />
      </div>
    </div>
  );
}
