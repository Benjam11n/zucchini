import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import type { CSSProperties } from "react";

import { HabitActivityRingGlyph } from "@/renderer/shared/components/activity-ring";
import { Button } from "@/renderer/shared/ui/button";

const NO_DRAG_REGION_STYLE = {
  WebkitAppRegion: "no-drag",
} as CSSProperties;

interface FocusWidgetControlsProps {
  canReset: boolean;
  canSkipBreak: boolean;
  canStart: boolean;
  categoryProgress: Parameters<
    typeof HabitActivityRingGlyph
  >[0]["categoryProgress"];
  isBreak: boolean;
  isPaused: boolean;
  isRunning: boolean;
  skipBreakLabel: string;
  timerLabel: string;
  timerLabelColorClass: string;
  onClose: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkipBreak: () => void;
  onStartOrResume: () => void;
}

export function FocusWidgetControls({
  canReset,
  canSkipBreak,
  canStart,
  categoryProgress,
  isBreak,
  isPaused,
  isRunning,
  skipBreakLabel,
  timerLabel,
  timerLabelColorClass,
  onClose,
  onPause,
  onReset,
  onSkipBreak,
  onStartOrResume,
}: FocusWidgetControlsProps) {
  return (
    <>
      <div className="flex items-center">
        <p
          className={`min-w-[56px] text-left text-[1.12rem] leading-none font-black tracking-tight tabular-nums ${timerLabelColorClass}`}
        >
          {timerLabel}
        </p>
      </div>

      {isBreak ? (
        <div
          className="rounded-full border border-border bg-muted px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase"
          style={NO_DRAG_REGION_STYLE}
        >
          {skipBreakLabel === "Skip long break" ? "Long break" : "Short break"}
        </div>
      ) : null}

      <div
        className="flex items-center gap-1 rounded-full border border-border bg-muted p-1"
        style={NO_DRAG_REGION_STYLE}
      >
        {canStart ? (
          <Button
            aria-label={isPaused ? "Resume timer" : "Start timer"}
            className="rounded-full"
            onClick={onStartOrResume}
            size="icon-xs"
          >
            <Play className="size-3.5" />
          </Button>
        ) : null}

        {isRunning ? (
          <Button
            aria-label="Pause timer"
            className="rounded-full"
            onClick={onPause}
            size="icon-xs"
            variant="secondary"
          >
            <Pause className="size-3.5" />
          </Button>
        ) : null}

        {canReset ? (
          <Button
            aria-label="Reset timer"
            className="rounded-full"
            onClick={onReset}
            size="icon-xs"
            variant="ghost"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : null}

        {canSkipBreak ? (
          <Button
            aria-label={skipBreakLabel}
            className="rounded-full"
            onClick={onSkipBreak}
            size="icon-xs"
            variant="ghost"
          >
            <SkipForward className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="px-0.5" style={NO_DRAG_REGION_STYLE}>
        <HabitActivityRingGlyph categoryProgress={categoryProgress} size={28} />
      </div>

      <Button
        aria-label="Close widget"
        className="rounded-full"
        onClick={onClose}
        size="icon-xs"
        style={NO_DRAG_REGION_STYLE}
        variant="ghost"
      >
        <X className="size-3.5" />
      </Button>
    </>
  );
}
