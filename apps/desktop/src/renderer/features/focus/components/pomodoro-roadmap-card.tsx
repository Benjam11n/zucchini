import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

interface RoadmapSegment {
  durationMs: number;
  key: string;
  label: string;
  tone: "focus" | "longBreak" | "shortBreak";
}

const SEGMENT_TONE_CLASS = {
  focus: "bg-emerald-400/90",
  longBreak: "bg-orange-400/90",
  shortBreak: "bg-amber-400/90",
} as const;

const ACTIVE_SEGMENT_CLASS = {
  focus: "ring-2 ring-emerald-200/80",
  longBreak: "ring-2 ring-orange-200/80",
  shortBreak: "ring-2 ring-amber-200/80",
} as const;

function formatDuration(durationMs: number): string {
  const totalMinutes = Math.round(durationMs / 60_000);
  return `${totalMinutes}m`;
}

function createRoadmapSegments(
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

function getActiveSegmentKey(
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

function getTickLabels(segments: RoadmapSegment[]): {
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
        label: formatDuration(elapsedMs),
      };
    }),
  ];
}

export function PomodoroRoadmapCard({
  settings,
  timerState,
}: {
  settings: PomodoroTimerSettings;
  timerState: PersistedFocusTimerState;
}) {
  const segments = createRoadmapSegments(settings);
  const activeKey = getActiveSegmentKey(
    timerState,
    settings.focusCyclesBeforeLongBreak
  );
  const totalSetDurationMs = segments.reduce(
    (totalDuration, segment) => totalDuration + segment.durationMs,
    0
  );
  const tickLabels = getTickLabels(segments);

  return (
    <div className="space-y-2.5">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40 p-2.5">
        <div className="flex h-5 items-stretch overflow-hidden rounded-xl bg-muted/20">
          {segments.map((segment) => (
            <div
              aria-label={`${segment.label} ${formatDuration(segment.durationMs)}`}
              className={`min-w-2 self-stretch ${SEGMENT_TONE_CLASS[segment.tone]} ${
                segment.key === activeKey
                  ? ACTIVE_SEGMENT_CLASS[segment.tone]
                  : ""
              }`}
              key={segment.key}
              style={{
                width: `${(segment.durationMs / totalSetDurationMs) * 100}%`,
              }}
              title={`${segment.label} · ${formatDuration(segment.durationMs)}`}
            />
          ))}
        </div>

        <div className="mt-2 flex items-start justify-between gap-2 text-[11px] text-muted-foreground">
          {tickLabels.map((tick) => (
            <span className="shrink-0" key={tick.key}>
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end rounded-xl border border-border/60 bg-muted/10 px-3 py-2">
        <p className="text-sm font-semibold text-foreground">
          Total set: {formatDuration(totalSetDurationMs)}
        </p>
      </div>
    </div>
  );
}
