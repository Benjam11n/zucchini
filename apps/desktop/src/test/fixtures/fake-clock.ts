import type { Clock } from "@/shared/domain/clock";
import { addDays } from "@/shared/domain/date-key";

export class FakeClock implements Clock {
  readonly addDays = addDays;

  private readonly comparisonLocale = "en";
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

  compareDateKeys(left: string, right: string): number {
    return left.localeCompare(right, this.comparisonLocale);
  }

  timezone(): string {
    return this.tz;
  }
}
