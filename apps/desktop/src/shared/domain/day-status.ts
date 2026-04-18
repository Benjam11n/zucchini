export type DayStatusKind = "sick";

export interface DayStatus {
  createdAt: string;
  date: string;
  kind: DayStatusKind;
}
