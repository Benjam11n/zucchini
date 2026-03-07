export interface Clock {
  now: () => Date;
  todayKey: () => string;
  addDays: (dateKey: string, amount: number) => string;
  compareDateKeys: (left: string, right: string) => number;
  timezone: () => string;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export const systemClock: Clock = {
  addDays: (dateKey, amount) => {
    const next = parseDateKey(dateKey);
    next.setDate(next.getDate() + amount);
    return formatDateKey(next);
  },
  compareDateKeys: (left, right) => left.localeCompare(right),
  now: () => new Date(),
  timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  todayKey: () => formatDateKey(new Date()),
};
