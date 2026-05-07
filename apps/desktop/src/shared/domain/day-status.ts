export type DayStatusKind = "rescheduled" | "rest" | "sick";

export interface DayStatus {
  createdAt: string;
  date: string;
  kind: DayStatusKind;
}
