import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { PersistedFocusTimerState } from "./types";
import { formatTimerLabel } from "./use-focus-timer";

interface FocusTimerCardProps {
  timerState: PersistedFocusTimerState;
  onPause: () => void;
  onReset: () => void;
  onResume: () => void;
  onShowWidget: () => void;
  onSkipBreak: () => void;
  onStart: () => void;
}

export function FocusTimerCard({
  timerState,
  onPause,
  onReset,
  onResume,
  onShowWidget,
  onSkipBreak,
  onStart,
}: FocusTimerCardProps) {
  const isBreak = timerState.phase === "break";
  const isIdle = timerState.status === "idle";
  const isPaused = timerState.status === "paused";
  const isRunning = timerState.status === "running";

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardDescription>Pomodoro</CardDescription>
            <CardTitle>Focused work timer</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onShowWidget} size="sm" variant="outline">
              Show widget
            </Button>
            <Badge variant={isBreak ? "secondary" : "default"}>
              {isBreak ? "Break" : "Focus"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-3xl border border-border/60 bg-muted/30 px-6 py-8 text-center">
          <p className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            {formatTimerLabel(timerState.remainingMs)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Completed focus sessions are saved automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isIdle ? (
            <Button className="min-w-28" onClick={onStart}>
              <Play className="size-4" />
              Start
            </Button>
          ) : null}

          {isRunning ? (
            <Button className="min-w-28" onClick={onPause} variant="secondary">
              <Pause className="size-4" />
              Pause
            </Button>
          ) : null}

          {isPaused ? (
            <Button className="min-w-28" onClick={onResume}>
              <Play className="size-4" />
              Resume
            </Button>
          ) : null}

          {isIdle ? null : (
            <Button
              className="min-w-28"
              onClick={isBreak ? onSkipBreak : onReset}
              variant="outline"
            >
              {isBreak ? (
                <>
                  <SkipForward className="size-4" />
                  Skip break
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Reset
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
