import type { HistoryStatus } from "@/renderer/shared/types/contribution";

export const HISTORY_STATUS_UI: Record<
  HistoryStatus,
  {
    badgeClassName: string;
    squareClassName: string;
  }
> = {
  complete: {
    badgeClassName:
      "border-primary/35 bg-primary/8 text-primary dark:border-primary/45 dark:bg-primary/14 dark:text-primary",
    squareClassName: "border-primary/80 bg-primary",
  },
  empty: {
    badgeClassName:
      "border-border/60 bg-transparent text-muted-foreground/70 dark:text-muted-foreground/60",
    squareClassName: "border-border/60 bg-transparent",
  },
  freeze: {
    badgeClassName:
      "border-sky-500/35 bg-sky-500/8 text-sky-700 dark:border-sky-400/45 dark:bg-sky-400/14 dark:text-sky-300",
    squareClassName: "border-sky-500/85 bg-sky-400/85",
  },
  "in-progress": {
    badgeClassName:
      "border-orange-500/35 bg-orange-500/8 text-orange-600 dark:border-orange-500/45 dark:bg-orange-500/14 dark:text-orange-400",
    squareClassName: "border-orange-500/80 bg-orange-500/50",
  },
  missed: {
    badgeClassName:
      "border-border/70 bg-muted/55 text-foreground dark:border-border/80 dark:bg-muted/70 dark:text-foreground",
    squareClassName: "border-border/70 bg-muted/55",
  },
  rest: {
    badgeClassName:
      "border-sky-500/35 bg-sky-500/8 text-sky-700 dark:border-sky-400/45 dark:bg-sky-400/14 dark:text-sky-300",
    squareClassName: "border-sky-500/85 bg-sky-400/85",
  },
  sick: {
    badgeClassName:
      "border-amber-500/35 bg-amber-500/8 text-amber-700 dark:border-amber-400/45 dark:bg-amber-400/14 dark:text-amber-300",
    squareClassName: "border-amber-500/85 bg-amber-400/85",
  },
};

export const HISTORY_METRIC_BADGE_CLASS_NAMES = {
  completedDays: HISTORY_STATUS_UI.complete.badgeClassName,
  completionRate: HISTORY_STATUS_UI.complete.badgeClassName,
  freezeDays: HISTORY_STATUS_UI.freeze.badgeClassName,
  missedDays: HISTORY_STATUS_UI.missed.badgeClassName,
  restDays: HISTORY_STATUS_UI.rest.badgeClassName,
  sickDays: HISTORY_STATUS_UI.sick.badgeClassName,
} as const;
