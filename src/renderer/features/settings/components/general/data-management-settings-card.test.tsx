// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DataManagementSettingsCard } from "./data-management-settings-card";

function setHabitsApi() {
  const habits = {
    archiveHabit: vi.fn(),
    claimFocusTimerCycleCompletion: vi.fn(),
    claimFocusTimerLeadership: vi.fn(),
    createHabit: vi.fn(),
    exportBackup: vi.fn(() => Promise.resolve("/tmp/zucchini-backup.db")),
    getDesktopNotificationStatus: vi.fn(),
    getFocusSessions: vi.fn(),
    getHistory: vi.fn(),
    getTodayState: vi.fn(),
    getWeeklyReview: vi.fn(),
    getWeeklyReviewOverview: vi.fn(),
    importBackup: vi.fn(() => Promise.resolve(true)),
    onFocusSessionRecorded: vi.fn(() => vi.fn()),
    openDataFolder: vi.fn(() =>
      Promise.resolve("/Users/test/Library/Application Support/Zucchini")
    ),
    recordFocusSession: vi.fn(),
    releaseFocusTimerLeadership: vi.fn(),
    renameHabit: vi.fn(),
    reorderHabits: vi.fn(),
    resizeFocusWidget: vi.fn(),
    showFocusWidget: vi.fn(),
    showMainWindow: vi.fn(),
    showNotification: vi.fn(),
    toggleHabit: vi.fn(),
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

describe("data management settings card", () => {
  it("opens the local data folder from settings", async () => {
    const habits = setHabitsApi();

    render(<DataManagementSettingsCard />);

    fireEvent.click(screen.getByRole("button", { name: /open folder/i }));

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(habits.openDataFolder).toHaveBeenCalledOnce();
    });
    expect(
      screen.getByText(/opened zucchini in your file manager/i)
    ).toBeInTheDocument();
  });

  it("exports a backup from settings", async () => {
    const habits = setHabitsApi();

    render(<DataManagementSettingsCard />);

    fireEvent.click(screen.getByRole("button", { name: /export backup/i }));

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(habits.exportBackup).toHaveBeenCalledOnce();
    });
    expect(
      screen.getByText(/backup exported as zucchini-backup\.db/i)
    ).toBeInTheDocument();
  });

  it("warns before importing a backup", async () => {
    const habits = setHabitsApi();

    render(<DataManagementSettingsCard />);

    fireEvent.click(screen.getByRole("button", { name: /import backup/i }));

    await expect(
      screen.findByText(/zucchini will restart immediately/i)
    ).resolves.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /import and restart/i })
    );

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(habits.importBackup).toHaveBeenCalledOnce();
    });
  });
});
