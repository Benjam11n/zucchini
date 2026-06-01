import {
  getTimelineSegmentAriaLabel,
  getTimelineSegmentClassName,
  getTimelineSegmentTooltip,
} from "@/renderer/features/focus/lib/focus-run-timeline-view";
import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";

interface FocusRunTimelineProps {
  session: FocusHistorySessionView;
}

export function FocusRunTimeline({ session }: FocusRunTimelineProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div
        aria-label={`Focus timeline for ${session.completedLoopCount} completed loop${session.completedLoopCount === 1 ? "" : "s"}${session.hasPartialEntry ? " and a partial entry" : ""}${session.timelineSegments.some((segment) => segment.kind === "break") ? " with breaks" : ""}${session.hasPausedTime ? " and paused time" : ""}`}
        className="relative h-3 overflow-hidden rounded-full bg-muted/70"
      >
        {session.timelineSegments.map((segment) => (
          <Tooltip key={segment.id}>
            <TooltipTrigger asChild>
              <button
                aria-label={getTimelineSegmentAriaLabel(segment)}
                className={cn(
                  "absolute top-0 h-full rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2",
                  getTimelineSegmentClassName(segment)
                )}
                style={{
                  left: `${(segment.startOffsetMinutes / session.sessionSpanMinutes) * 100}%`,
                  width: `${segment.widthPercent * 100}%`,
                }}
                type="button"
              />
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {getTimelineSegmentTooltip(segment)}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
