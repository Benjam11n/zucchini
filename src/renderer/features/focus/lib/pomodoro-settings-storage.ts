import {
  createDefaultPomodoroTimerSettings,
  isValidPomodoroTimerSettings,
} from "@/shared/domain/settings";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

const POMODORO_SETTINGS_STORAGE_KEY = "zucchini_pomodoro_settings";
const POMODORO_SETTINGS_STORAGE_EVENT = "storage";

function parsePomodoroTimerSettings(
  value: unknown
): PomodoroTimerSettings | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<PomodoroTimerSettings>;
  if (
    typeof candidate.focusDefaultDurationSeconds !== "number" ||
    typeof candidate.focusCyclesBeforeLongBreak !== "number" ||
    typeof candidate.focusLongBreakMinutes !== "number" ||
    typeof candidate.focusShortBreakMinutes !== "number"
  ) {
    return null;
  }

  const settings: PomodoroTimerSettings = {
    focusCyclesBeforeLongBreak: candidate.focusCyclesBeforeLongBreak,
    focusDefaultDurationSeconds: candidate.focusDefaultDurationSeconds,
    focusLongBreakMinutes: candidate.focusLongBreakMinutes,
    focusShortBreakMinutes: candidate.focusShortBreakMinutes,
  };

  return isValidPomodoroTimerSettings(settings) ? settings : null;
}

export function getDefaultPomodoroTimerSettings(): PomodoroTimerSettings {
  return createDefaultPomodoroTimerSettings();
}

export function readPomodoroTimerSettings(): PomodoroTimerSettings | null {
  try {
    const rawValue = localStorage.getItem(POMODORO_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return parsePomodoroTimerSettings(JSON.parse(rawValue) as unknown);
  } catch {
    return null;
  }
}

export function writePomodoroTimerSettings(
  settings: PomodoroTimerSettings
): void {
  try {
    localStorage.setItem(
      POMODORO_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Ignore storage failures; saved settings remain available via IPC.
  }
}

export function subscribeToPomodoroTimerSettings(
  onChange: (settings: PomodoroTimerSettings | null) => void
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== POMODORO_SETTINGS_STORAGE_KEY) {
      return;
    }

    if (!event.newValue) {
      onChange(null);
      return;
    }

    try {
      onChange(
        parsePomodoroTimerSettings(JSON.parse(event.newValue) as unknown)
      );
    } catch {
      onChange(null);
    }
  };

  window.addEventListener(POMODORO_SETTINGS_STORAGE_EVENT, handleStorage);

  return () => {
    window.removeEventListener(POMODORO_SETTINGS_STORAGE_EVENT, handleStorage);
  };
}
