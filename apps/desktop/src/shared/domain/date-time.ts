export function toIsoTimestamp(date: Date): string {
  return date.toISOString();
}

export function addMsIso(date: Date, amountMs: number): string {
  return new Date(date.getTime() + amountMs).toISOString();
}

export function msUntil(isoTimestamp: string, now: Date | number): number {
  const nowMs = typeof now === "number" ? now : now.getTime();
  return Math.max(Date.parse(isoTimestamp) - nowMs, 0);
}
