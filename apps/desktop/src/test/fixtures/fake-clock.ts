import type { Clock } from "@/shared/domain/clock";
import { parseDateKey } from "@/shared/utils/date";

export class FakeClock implements Clock {
  private readonly comparisonLocale = "en";
  private readonly dateParser = parseDateKey;
  private readonly today: string;
  private readonly nowIso: string;
  private readonly tz: string;

  constructor(today: string, nowIso: string, tz = "Asia/Singapore") {
    this.today = today;
    this.nowIso = nowIso;
    this.tz = tz;
  }

  now(): Date {
    return new Date(this.nowIso);
  }

  todayKey(): string {
    return this.today;
  }

  addDays(dateKey: string, amount: number): string {
    const next = this.dateParser(dateKey);
    next.setDate(next.getDate() + amount);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  compareDateKeys(left: string, right: string): number {
    return left.localeCompare(right, this.comparisonLocale);
  }

  timezone(): string {
    return this.tz;
  }
}
