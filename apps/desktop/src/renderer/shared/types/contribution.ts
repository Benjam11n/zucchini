export type ContributionIntensity = 0 | 1 | 2 | 3 | 4;

export type ContributionStatus =
  | "complete"
  | "empty"
  | "freeze"
  | "sick"
  | "missed"
  | "in-progress";

export type HistoryStatus = ContributionStatus;
