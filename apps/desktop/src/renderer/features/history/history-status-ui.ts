import type { HistoryStatus } from "@/renderer/features/history/history-status";

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
      "border-secondary/65 bg-secondary text-secondary-foreground dark:border-secondary/70 dark:bg-secondary/90 dark:text-secondary-foreground",
    squareClassName: "border-secondary/80 bg-secondary/75",
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
};

export const HISTORY_METRIC_BADGE_CLASS_NAMES = {
  completedDays: HISTORY_STATUS_UI.complete.badgeClassName,
  completionRate: HISTORY_STATUS_UI.complete.badgeClassName,
  freezeDays: HISTORY_STATUS_UI.freeze.badgeClassName,
  missedDays: HISTORY_STATUS_UI.missed.badgeClassName,
} as const;
