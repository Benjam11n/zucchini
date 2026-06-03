import { formatDateKey } from "@/shared/domain/date-key";

export function formatInsightsDate(dateKey: string): string {
  return formatDateKey(dateKey, "fullDate", "en-US");
}
