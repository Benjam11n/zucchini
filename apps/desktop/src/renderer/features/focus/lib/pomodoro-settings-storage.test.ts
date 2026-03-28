// @vitest-environment jsdom

import {
  readPomodoroTimerSettings,
  writePomodoroTimerSettings,
} from "./pomodoro-settings-storage";

function createLocalStorageMock() {
  const storage = new Map<string, string>();

  return {
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };
}

function installLocalStorageMock() {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: createLocalStorageMock(),
  });
  localStorage.clear();
}

describe("pomodoro settings storage", () => {
  it("round-trips saved pomodoro settings through localStorage", () => {
    installLocalStorageMock();
    const settings = {
      focusCyclesBeforeLongBreak: 4,
      focusDefaultDurationSeconds: 1500,
      focusLongBreakSeconds: 15 * 60,
      focusShortBreakSeconds: 5 * 60,
    };

    writePomodoroTimerSettings(settings);

    expect(readPomodoroTimerSettings()).toStrictEqual(settings);
  });

  it("returns null for invalid stored settings", () => {
    installLocalStorageMock();
    localStorage.setItem(
      "zucchini_pomodoro_settings",
      JSON.stringify({
        focusCyclesBeforeLongBreak: 4,
        focusDefaultDurationSeconds: 1500,
        focusLongBreakSeconds: 3 * 60,
        focusShortBreakSeconds: 5 * 60,
      })
    );

    expect(readPomodoroTimerSettings()).toBeNull();
  });
});
