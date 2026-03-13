// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import type { AppSettings } from "@/shared/domain/settings";

import { PomodoroSettingsFields } from "./pomodoro-settings-fields";

const settings: AppSettings = {
  focusCyclesBeforeLongBreak: 4,
  focusDefaultDurationSeconds: 25 * 60,
  focusLongBreakSeconds: 15 * 60,
  focusShortBreakSeconds: 5 * 60,
  launchAtLogin: false,
  minimizeToTray: false,
  reminderEnabled: true,
  reminderSnoozeMinutes: 15,
  reminderTime: "20:30",
  themeMode: "system",
  timezone: "Asia/Singapore",
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
      focusDefaultDurationSeconds: 12 * 60,
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
    expect(longBreakMinutesInput).toHaveValue("15");
  });
});
