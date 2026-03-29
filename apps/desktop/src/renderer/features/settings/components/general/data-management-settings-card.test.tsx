// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { installMockHabitsApi } from "@/test/fixtures/habits-api-mock";

import { DataManagementSettingsCard } from "./data-management-settings-card";

function setHabitsApi() {
  return installMockHabitsApi({
    exportBackup: vi.fn(() => Promise.resolve("/tmp/zucchini-backup.db")),
    importBackup: vi.fn(() => Promise.resolve(true)),
    openDataFolder: vi.fn(() =>
      Promise.resolve("/Users/test/Library/Application Support/Zucchini")
    ),
  });
}

describe("data management settings card", () => {
  it("opens the local data folder from settings", async () => {
    const habits = setHabitsApi();

    render(<DataManagementSettingsCard />);

    fireEvent.click(screen.getByRole("button", { name: /open folder/i }));

    await waitFor(() => {
      expect(habits.openDataFolder.mock.calls).toHaveLength(1);
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
      expect(habits.exportBackup.mock.calls).toHaveLength(1);
    });
    await waitFor(() => {
      expect(
        screen.getByText(/backup exported as zucchini-backup\.db/i)
      ).toBeInTheDocument();
    });
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
      expect(habits.importBackup.mock.calls).toHaveLength(1);
    });
  });
});
