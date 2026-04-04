import { Settings2 } from "lucide-react";
import { VisuallyHidden } from "radix-ui";

import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";

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
          <VisuallyHidden.Root>
            <CardDescription>Pomodoro</CardDescription>
          </VisuallyHidden.Root>
          <CardTitle>Focused work timer</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onOpenPomodoroSettings} size="sm" variant="ghost">
            <Settings2 className="size-4" />
            Settings
          </Button>
          <Button
            className="border-white/10 bg-white/3 px-4"
            onClick={onShowWidget}
            size="sm"
            variant="outline"
          >
            Show widget
          </Button>
          <Badge className="px-3 py-1" variant={phaseBadge.variant}>
            {phaseBadge.label}
          </Badge>
        </div>
      </div>
    </CardHeader>
  );
}
