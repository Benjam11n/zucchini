import {
  formatFocusMinutes,
  getFocusMinutesLabel,
} from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { formatIsoTime } from "@/shared/domain/date-key";

type TimelineSegment = FocusHistorySessionView["timelineSegments"][number];

function formatSessionTime(value: string): string {
  return formatIsoTime(value);
}

export function getTimelineSegmentClassName(segment: TimelineSegment): string {
  if (segment.kind === "break") {
    return "bg-amber-400/80 focus-visible:ring-amber-500/60";
  }

  if (segment.kind === "pause") {
    return "bg-slate-400/70 focus-visible:ring-slate-500/60";
  }

  if (segment.entryKind === "partial") {
    return "bg-primary/45 focus-visible:ring-primary/50";
  }

  return "bg-primary/85 focus-visible:ring-primary/60";
}

export function getTimelineSegmentAriaLabel(segment: TimelineSegment): string {
  if (segment.kind === "break") {
    return `${segment.durationMinutes} minute break`;
  }

  if (segment.kind === "pause") {
    return `${segment.durationMinutes} minute pause`;
  }

  return `${segment.entryKind === "partial" ? "Partial " : ""}${formatSessionTime(segment.startedAt)} to ${formatSessionTime(segment.completedAt)}, ${getFocusMinutesLabel(formatFocusMinutes(segment.durationSeconds))}`;
}

export function getTimelineSegmentTooltip(segment: TimelineSegment): string {
  if (segment.kind === "break") {
    return `${segment.durationMinutes} min break`;
  }

  if (segment.kind === "pause") {
    return `${segment.durationMinutes} min paused`;
  }

  return `${segment.entryKind === "partial" ? "Partial · " : ""}${formatSessionTime(segment.startedAt)} - ${formatSessionTime(segment.completedAt)} · ${formatFocusMinutes(segment.durationSeconds)} min`;
}
