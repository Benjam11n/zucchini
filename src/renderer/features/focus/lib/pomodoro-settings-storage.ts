import {
  readJsonStorage,
  STORAGE_KEYS,
  subscribeToStorageKey,
  writeJsonStorage,
} from "@/renderer/shared/lib/storage";
import {
  createDefaultPomodoroTimerSettings,
  isValidPomodoroTimerSettings,
} from "@/shared/domain/settings";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

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
  return parsePomodoroTimerSettings(
    readJsonStorage(STORAGE_KEYS.pomodoroSettings)
  );
}

export function writePomodoroTimerSettings(
  settings: PomodoroTimerSettings
): void {
  if (!writeJsonStorage(STORAGE_KEYS.pomodoroSettings, settings)) {
    // Ignore storage failures; saved settings remain available via IPC.
  }
}

export function subscribeToPomodoroTimerSettings(
  onChange: (settings: PomodoroTimerSettings | null) => void
): () => void {
  return subscribeToStorageKey(STORAGE_KEYS.pomodoroSettings, (value) => {
    onChange(parsePomodoroTimerSettings(value));
  });
}
