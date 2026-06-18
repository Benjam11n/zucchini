export function normalizeDurationInputValue(
  minutesInput: string,
  secondsInput: string,
  minSeconds: number,
  maxSeconds: number
): number | null {
  if (!minutesInput || !secondsInput) {
    return null;
  }

  const parsedMinutes = Number.parseInt(minutesInput, 10);
  const parsedSeconds = Number.parseInt(secondsInput, 10);

  if (Number.isNaN(parsedMinutes) || Number.isNaN(parsedSeconds)) {
    return null;
  }

  const normalizedMinutes = Math.min(60, Math.max(0, parsedMinutes));
  const normalizedSeconds =
    normalizedMinutes === 60 ? 0 : Math.min(59, Math.max(0, parsedSeconds));
  const totalSeconds = normalizedMinutes * 60 + normalizedSeconds;

  return Math.min(maxSeconds, Math.max(minSeconds, totalSeconds));
}
