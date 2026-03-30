import { TimerReset } from "lucide-react";
import { useEffect, useState } from "react";

import { PomodoroSettingsFields } from "@/renderer/features/settings/components/general/pomodoro-settings-fields";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import type { FocusTimerShortcutStatus } from "@/shared/contracts/habits-ipc";

export function PomodoroSettingsCard({
  fieldErrors,
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  const [shortcutStatus, setShortcutStatus] =
    useState<FocusTimerShortcutStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadShortcutStatus() {
      try {
        const nextStatus = await window.habits.getFocusTimerShortcutStatus();

        if (!cancelled) {
          setShortcutStatus(nextStatus);
        }
      } catch {
        if (!cancelled) {
          setShortcutStatus(null);
        }
      }
    }

    loadShortcutStatus();

    const unsubscribe =
      window.habits.onFocusTimerShortcutStatusChanged(setShortcutStatus);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const shortcutWarnings = shortcutStatus
    ? [shortcutStatus.toggle, shortcutStatus.reset].filter(
        (registration) => registration.errorMessage
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TimerReset className="size-4 text-primary" />
          <CardTitle>Pomodoro</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {shortcutWarnings.map((registration) => (
          <p
            key={registration.accelerator}
            className="mb-3 text-sm text-amber-700 dark:text-amber-300"
          >
            {registration.errorMessage}
            {registration.activeAccelerator
              ? ` Still active: ${registration.activeAccelerator}.`
              : ""}
          </p>
        ))}
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
