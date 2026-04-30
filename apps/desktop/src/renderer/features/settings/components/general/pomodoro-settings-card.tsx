import { TimerReset } from "lucide-react";
import { useEffect, useState } from "react";

import { PomodoroSettingsFields } from "@/renderer/features/settings/components/general/pomodoro-settings-fields";
import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import type { FocusTimerShortcutStatus } from "@/shared/contracts/habits-api";

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
      <SettingsCardHeader
        description="Adjust timer lengths and review global keyboard shortcuts."
        icon={TimerReset}
        title="Pomodoro"
      />
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
