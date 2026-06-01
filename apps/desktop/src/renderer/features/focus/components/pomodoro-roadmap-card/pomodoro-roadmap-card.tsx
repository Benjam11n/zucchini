import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import {
  ACTIVE_SEGMENT_CLASS,
  createRoadmapSegments,
  formatRoadmapDuration,
  getActiveSegmentKey,
  getTickLabels,
  SEGMENT_TONE_CLASS,
} from "@/renderer/features/focus/lib/pomodoro-roadmap-view";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

interface PomodoroRoadmapCardProps {
  settings: PomodoroTimerSettings;
  timerState: PersistedFocusTimerState;
}

export function PomodoroRoadmapCard({
  settings,
  timerState,
}: PomodoroRoadmapCardProps) {
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
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            Total set: {formatRoadmapDuration(totalSetDurationMs)}
          </p>
        </div>

        <div className="flex h-5 items-stretch overflow-hidden rounded-xl bg-muted/20">
          {segments.map((segment) => (
            <div
              aria-label={`${segment.label} ${formatRoadmapDuration(segment.durationMs)}`}
              className={`min-w-2 self-stretch ${SEGMENT_TONE_CLASS[segment.tone]} ${
                segment.key === activeKey
                  ? ACTIVE_SEGMENT_CLASS[segment.tone]
                  : ""
              }`}
              key={segment.key}
              style={{
                width: `${(segment.durationMs / totalSetDurationMs) * 100}%`,
              }}
              title={`${segment.label} · ${formatRoadmapDuration(segment.durationMs)}`}
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
    </div>
  );
}
