// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DesktopNotificationStatus } from "@/shared/contracts/habits-api";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import type { AppSettings } from "@/shared/domain/settings";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import { installMockHabitsApi } from "@/test/fixtures/habits-api-mock";

import { ReminderSettingsCard } from "./reminder-settings-card";

const defaultSettings: AppSettings = {
  ...createDefaultAppSettings("Asia/Singapore"),
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

const defaultNotificationStatus: DesktopNotificationStatus = {
  availability: "available",
  reason: null,
};

function setHabitsApi(
  notificationStatus: DesktopNotificationStatus = defaultNotificationStatus
) {
  return installMockHabitsApi({
    getDesktopNotificationStatus: vi.fn().mockResolvedValue(notificationStatus),
  });
}

describe("reminder settings card", () => {
  it("shows a blocked notification warning when reminders are enabled", async () => {
    setHabitsApi({
      availability: "blocked",
      reason: "do-not-disturb",
    });

    render(
      <ReminderSettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={defaultSettings}
      />
    );

    await expect(
      screen.findByText(/silenced by do not disturb/i)
    ).resolves.toBeInTheDocument();
  });

  it("does not show a notification warning when desktop delivery is available", async () => {
    const habits = setHabitsApi({
      availability: "available",
      reason: null,
    });

    render(
      <ReminderSettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={defaultSettings}
      />
    );

    await waitFor(() => {
      expect(habits.getDesktopNotificationStatus.mock.calls).toHaveLength(1);
    });

    expect(
      screen.queryByText(/desktop notifications are currently/i)
    ).not.toBeInTheDocument();
  });

  it("shows an informational message when desktop delivery is unsupported", async () => {
    setHabitsApi({
      availability: "unsupported",
      reason: "unsupported-platform",
    });

    render(
      <ReminderSettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={defaultSettings}
      />
    );

    await expect(
      screen.findByText(
        /cannot verify desktop notification delivery on this platform/i
      )
    ).resolves.toBeInTheDocument();
  });

  it("shows an informational message when desktop delivery status is unknown", async () => {
    setHabitsApi({
      availability: "unknown",
      reason: "platform-error",
    });

    render(
      <ReminderSettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={defaultSettings}
      />
    );

    await expect(
      screen.findByText(
        /cannot verify desktop notification delivery right now/i
      )
    ).resolves.toBeInTheDocument();
  });

  it("updates the reminder toggle without changing its behavior", () => {
    setHabitsApi();
    const onChange = vi.fn();

    render(
      <ReminderSettingsCard
        fieldErrors={{}}
        onChange={onChange}
        settings={defaultSettings}
      />
    );

    fireEvent.click(screen.getByRole("switch", { name: /enable reminder/i }));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultSettings,
      reminderEnabled: false,
    });
  });

  it("refreshes desktop notification status when the window regains focus", async () => {
    const habits = setHabitsApi();

    render(
      <ReminderSettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={defaultSettings}
      />
    );

    await waitFor(() => {
      expect(habits.getDesktopNotificationStatus.mock.calls).toHaveLength(1);
    });

    fireEvent(window, new Event("focus"));

    await waitFor(() => {
      expect(habits.getDesktopNotificationStatus).toHaveBeenCalledTimes(2);
    });
  });
});
