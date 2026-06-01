import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

interface RoadmapSegment {
  durationMs: number;
  key: string;
  label: string;
  tone: "focus" | "longBreak" | "shortBreak";
}

export const SEGMENT_TONE_CLASS = {
  focus: "bg-emerald-400/90",
  longBreak: "bg-orange-400/90",
  shortBreak: "bg-amber-400/90",
} as const;

export const ACTIVE_SEGMENT_CLASS = {
  focus: "ring-2 ring-emerald-200/80",
  longBreak: "ring-2 ring-orange-200/80",
  shortBreak: "ring-2 ring-amber-200/80",
} as const;

export function formatRoadmapDuration(durationMs: number): string {
  const totalMinutes = Math.round(durationMs / 60_000);
  return `${totalMinutes}m`;
}

export function createRoadmapSegments(
  settings: PomodoroTimerSettings
): RoadmapSegment[] {
  const segments: RoadmapSegment[] = [];

  for (
    let focusIndex = 1;
    focusIndex <= settings.focusCyclesBeforeLongBreak;
    focusIndex += 1
  ) {
    segments.push({
      durationMs: settings.focusDefaultDurationSeconds * 1000,
      key: `focus-${focusIndex}`,
      label: `Focus ${focusIndex}`,
      tone: "focus",
    });

    if (focusIndex < settings.focusCyclesBeforeLongBreak) {
      segments.push({
        durationMs: settings.focusShortBreakSeconds * 1000,
        key: `short-break-${focusIndex}`,
        label: "Short break",
        tone: "shortBreak",
      });
    }
  }

  segments.push({
    durationMs: settings.focusLongBreakSeconds * 1000,
    key: "long-break",
    label: "Long break",
    tone: "longBreak",
  });

  return segments;
}

export function getActiveSegmentKey(
  timerState: PersistedFocusTimerState,
  focusCyclesBeforeLongBreak: number
): string {
  if (timerState.phase === "break") {
    if (timerState.breakVariant === "long") {
      return "long-break";
    }

    return `short-break-${timerState.completedFocusCycles}`;
  }

  return `focus-${Math.min(
    timerState.completedFocusCycles + 1,
    focusCyclesBeforeLongBreak
  )}`;
}

export function getTickLabels(segments: RoadmapSegment[]): {
  key: string;
  label: string;
}[] {
  let elapsedMs = 0;

  return [
    {
      key: "tick-start",
      label: "0m",
    },
    ...segments.map((segment) => {
      elapsedMs += segment.durationMs;
      return {
        key: `tick-${elapsedMs}`,
        label: formatRoadmapDuration(elapsedMs),
      };
    }),
  ];
}
