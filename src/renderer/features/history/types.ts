import type { HistoryDay } from "@/shared/domain/history";

export interface HistoryPageProps {
  history: HistoryDay[];
}

export interface HistoryCalendarContextValue {
  historyByDate: Map<string, HistoryDay>;
  onSelectDate: (dateKey: string) => void;
  selectedDateKey: string | null;
}
