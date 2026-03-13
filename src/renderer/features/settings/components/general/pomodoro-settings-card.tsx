import { TimerReset } from "lucide-react";

import { PomodoroSettingsFields } from "@/renderer/features/settings/components/general/pomodoro-settings-fields";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";

export function PomodoroSettingsCard({
  fieldErrors,
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TimerReset className="size-4 text-primary" />
          <CardTitle>Pomodoro</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <PomodoroSettingsFields
          fieldErrors={fieldErrors}
          idPrefix="settings-pomodoro"
          onChange={onChange}
          settings={settings}
        />
      </CardContent>
    </Card>
  );
}
