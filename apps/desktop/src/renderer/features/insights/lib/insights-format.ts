import { formatDateKey } from "@/shared/domain/date-format";

export function formatInsightsDate(dateKey: string): string {
  return formatDateKey(dateKey, "fullDate", "en-US");
}
