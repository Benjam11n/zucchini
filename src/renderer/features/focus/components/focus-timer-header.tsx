import { Settings2 } from "lucide-react";

import { Badge } from "@/renderer/shared/ui/badge";
import { Button } from "@/renderer/shared/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";

interface FocusTimerHeaderProps {
  onOpenPomodoroSettings: () => void;
  onShowWidget: () => void;
  phaseBadge: {
    label: string;
    variant: "default" | "destructive" | "secondary";
  };
}

export function FocusTimerHeader({
  onOpenPomodoroSettings,
  onShowWidget,
  phaseBadge,
}: FocusTimerHeaderProps) {
  return (
    <CardHeader className="gap-4 pb-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <CardDescription>Pomodoro</CardDescription>
          <CardTitle>Focused work timer</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-full"
            onClick={onOpenPomodoroSettings}
            size="sm"
            variant="ghost"
          >
            <Settings2 className="size-4" />
            Settings
          </Button>
          <Button
            className="rounded-full border-white/10 bg-white/3 px-4"
            onClick={onShowWidget}
            size="sm"
            variant="outline"
          >
            Show widget
          </Button>
          <Badge
            className="rounded-full px-3 py-1"
            variant={phaseBadge.variant}
          >
            {phaseBadge.label}
          </Badge>
        </div>
      </div>
    </CardHeader>
  );
}
