export type DayStatusKind = "rest" | "sick";

export interface DayStatus {
  createdAt: string;
  date: string;
  kind: DayStatusKind;
}
