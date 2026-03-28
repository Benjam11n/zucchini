export function formatFocusMinutes(totalSeconds: number): number {
  if (totalSeconds <= 0) {
    return 0;
  }

  return Math.max(1, Math.round(totalSeconds / 60));
}

export function getFocusMinutesLabel(totalMinutes: number): string {
  return `${totalMinutes} focused minute${totalMinutes === 1 ? "" : "s"}`;
}
