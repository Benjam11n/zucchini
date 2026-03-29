// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import type { AppSettings } from "@/shared/domain/settings";
import {
  createTestAppSettings,
  minutes,
} from "@/test/fixtures/focus-test-utils";

import { PomodoroSettingsFields } from "./pomodoro-settings-fields";

const settings: AppSettings = {
  ...createTestAppSettings(),
  focusDefaultDurationSeconds: minutes(25),
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

describe("pomodoro settings fields", () => {
  it("keeps duration drafts editable until blur", () => {
    const onChange = vi.fn();

    render(
      <PomodoroSettingsFields
        fieldErrors={{}}
        idPrefix="pomodoro-test"
        onChange={onChange}
        settings={settings}
      />
    );

    const minutesInput = screen.getByLabelText("Default focus minutes");

    fireEvent.change(minutesInput, { target: { value: "" } });
    expect(minutesInput).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(minutesInput, { target: { value: "12" } });
    expect(minutesInput).toHaveValue("12");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(minutesInput);

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      focusDefaultDurationSeconds: minutes(12),
    });
  });

  it("supports seconds for break durations", () => {
    const onChange = vi.fn();

    render(
      <PomodoroSettingsFields
        fieldErrors={{}}
        idPrefix="pomodoro-test"
        onChange={onChange}
        settings={settings}
      />
    );

    const shortBreakMinutesInput = screen.getByLabelText("Short break minutes");
    const shortBreakSecondsInput = screen.getByLabelText("Short break seconds");

    fireEvent.change(shortBreakMinutesInput, { target: { value: "00" } });
    fireEvent.change(shortBreakSecondsInput, { target: { value: "45" } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(shortBreakSecondsInput);

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      focusShortBreakSeconds: 45,
    });
  });

  it("does not save invalid partial drafts", () => {
    const onChange = vi.fn();

    render(
      <PomodoroSettingsFields
        fieldErrors={{}}
        idPrefix="pomodoro-test"
        onChange={onChange}
        settings={settings}
      />
    );

    const longBreakMinutesInput = screen.getByLabelText("Long break minutes");

    fireEvent.change(longBreakMinutesInput, { target: { value: "" } });
    fireEvent.blur(longBreakMinutesInput);

    expect(onChange).not.toHaveBeenCalled();
    expect(longBreakMinutesInput).toHaveValue(
      String(settings.focusLongBreakSeconds / 60)
    );
  });

  it("updates the global toggle shortcut through the shared form state", () => {
    const onChange = vi.fn();

    render(
      <PomodoroSettingsFields
        fieldErrors={{}}
        idPrefix="pomodoro-test"
        onChange={onChange}
        settings={settings}
      />
    );

    fireEvent.change(
      screen.getByLabelText("Global start/pause/resume shortcut"),
      {
        target: { value: "Command+Option+Space" },
      }
    );

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      toggleFocusTimerShortcut: "Command+Option+Space",
    });
  });
});
