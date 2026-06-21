import { TimerReset } from "lucide-react";
import { useSyncExternalStore } from "react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header/settings-card-header";
import type {
  SettingsPageActions,
  SettingsPageViewModel,
} from "@/renderer/features/settings/settings.types";
import { PomodoroSettingsFields } from "@/renderer/shared/components/app/pomodoro-settings/pomodoro-settings-fields/pomodoro-settings-fields";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import type { FocusTimerShortcutStatus } from "@/shared/contracts/api/desktop-api";

interface PomodoroSettingsCardProps {
  fieldErrors: SettingsPageViewModel["fieldErrors"];
  onChange: SettingsPageActions["settings"]["change"];
  settings: SettingsPageViewModel["settings"];
}

let shortcutStatusSnapshot: FocusTimerShortcutStatus | null = null;
const shortcutStatusListeners = new Set<() => void>();

function emitShortcutStatusChange() {
  for (const listener of shortcutStatusListeners) {
    listener();
  }
}

async function refreshShortcutStatus() {
  try {
    shortcutStatusSnapshot = await window.desktop.getFocusTimerShortcutStatus();
  } catch {
    shortcutStatusSnapshot = null;
  }
  emitShortcutStatusChange();
}

function subscribeToShortcutStatus(onChange: () => void): () => void {
  shortcutStatusListeners.add(onChange);
  void refreshShortcutStatus();
  const unsubscribe = window.desktop.onFocusTimerShortcutStatusChanged(
    (nextStatus) => {
      shortcutStatusSnapshot = nextStatus;
      emitShortcutStatusChange();
    }
  );

  return () => {
    shortcutStatusListeners.delete(onChange);
    unsubscribe();
  };
}

function getShortcutStatusSnapshot(): FocusTimerShortcutStatus | null {
  return shortcutStatusSnapshot;
}

export function PomodoroSettingsCard({
  fieldErrors,
  onChange,
  settings,
}: PomodoroSettingsCardProps) {
  const shortcutStatus = useSyncExternalStore(
    subscribeToShortcutStatus,
    getShortcutStatusSnapshot,
    getShortcutStatusSnapshot
  );

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
