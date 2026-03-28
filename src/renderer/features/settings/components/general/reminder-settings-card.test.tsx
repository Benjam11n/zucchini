// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { DesktopNotificationStatus } from "@/shared/contracts/habits-ipc";
import type { AppSettings } from "@/shared/domain/settings";

import { ReminderSettingsCard } from "./reminder-settings-card";

const defaultSettings: AppSettings = {
  focusCyclesBeforeLongBreak: 4,
  focusDefaultDurationSeconds: 1500,
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

const availableNotificationStatus: DesktopNotificationStatus = {
  availability: "available",
  reason: null,
};

function setHabitsApi(
  notificationStatus: DesktopNotificationStatus = availableNotificationStatus
) {
  const habits = {
    archiveHabit: vi.fn(),
    claimFocusTimerCycleCompletion: vi.fn(),
    claimFocusTimerLeadership: vi.fn(),
    createHabit: vi.fn(),
    exportBackup: vi.fn(),
    getDesktopNotificationStatus: vi.fn().mockResolvedValue(notificationStatus),
    getFocusSessions: vi.fn(),
    getHabits: vi.fn(),
    getHistory: vi.fn(),
    getTodayState: vi.fn(),
    getWeeklyReview: vi.fn(),
    getWeeklyReviewOverview: vi.fn(),
    importBackup: vi.fn(),
    onFocusSessionRecorded: vi.fn(() => vi.fn()),
    openDataFolder: vi.fn(),
    recordFocusSession: vi.fn(),
    releaseFocusTimerLeadership: vi.fn(),
    renameHabit: vi.fn(),
    reorderHabits: vi.fn(),
    resizeFocusWidget: vi.fn(),
    showFocusWidget: vi.fn(),
    showMainWindow: vi.fn(),
    showNotification: vi.fn(),
    toggleHabit: vi.fn(),
    unarchiveHabit: vi.fn(),
    updateHabitCategory: vi.fn(),
    updateHabitFrequency: vi.fn(),
    updateHabitWeekdays: vi.fn(),
    updateSettings: vi.fn(),
  };

  Object.defineProperty(window, "habits", {
    configurable: true,
    value: habits,
  });

  return habits;
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
