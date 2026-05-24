// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { BackupRestorePreview } from "@/shared/contracts/api/habits-api";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import { installMockHabitsApi } from "@/test/fixtures/habits-api-mock";

import { DataManagementSettingsCard } from "./data-management-settings-card";

const storage = new Map<string, string>();
const localStorageMock = {
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

function createRestorePreview(
  overrides: Partial<BackupRestorePreview> = {}
): BackupRestorePreview {
  return {
    completedHabitCount: 12,
    fileName: "zucchini-auto-20260330-120000.db",
    filePath: "/tmp/Backups/zucchini-auto-20260330-120000.db",
    focusSessionCount: 3,
    habitCount: 5,
    habitPreviewTotalCount: 2,
    habits: [
      {
        category: "productivity",
        frequency: "daily",
        id: 1,
        name: "Plan top task",
        pausedAt: null,
        selectedWeekdays: null,
        sortOrder: 0,
        targetCount: 1,
      },
      {
        category: "fitness",
        frequency: "weekly",
        id: 2,
        name: "6500 steps",
        pausedAt: "2026-03-29T12:00:00.000Z",
        selectedWeekdays: null,
        sortOrder: 1,
        targetCount: 3,
      },
    ],
    latestActivityDate: "2026-03-30",
    modifiedAt: "2026-03-30T12:00:00.000Z",
    restoreId: "restore-1",
    sizeBytes: 2048,
    source: "auto",
    ...overrides,
  };
}

function setHabitsApi(
  overrides: Partial<ReturnType<typeof installMockHabitsApi>> = {}
) {
  return installMockHabitsApi({
    chooseBackupForRestore: vi.fn(() => Promise.resolve(null)),
    clearData: vi.fn(() => Promise.resolve(true)),
    exportBackup: vi.fn(() => Promise.resolve("/tmp/zucchini-backup.db")),
    exportCsvData: vi.fn(() =>
      Promise.resolve("/tmp/zucchini-csv-export-20260330")
    ),
    getLatestAutoBackupRestorePreview: vi.fn(() => Promise.resolve(null)),
    importBackup: vi.fn(() => Promise.resolve(true)),
    openAutoBackupFolder: vi.fn(() => Promise.resolve("/tmp/Backups")),
    openDataFolder: vi.fn(() =>
      Promise.resolve("/Users/test/Library/Application Support/Zucchini")
    ),
    restoreBackup: vi.fn(() => Promise.resolve(true)),
    ...overrides,
  });
}

function renderCard(
  options: {
    onChange?: (settings: ReturnType<typeof createDefaultAppSettings>) => void;
  } = {}
) {
  const settings = createDefaultAppSettings("Asia/Singapore");
  return render(
    <DataManagementSettingsCard
      onChange={options.onChange ?? vi.fn()}
      settings={settings}
    />
  );
}

describe("data management settings card", () => {
  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  });

  it("opens the local data folder from settings", async () => {
    const habits = setHabitsApi();

    renderCard();

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

    renderCard();

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

  it("exports CSV data from settings", async () => {
    const habits = setHabitsApi();

    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    await waitFor(() => {
      expect(habits.exportCsvData.mock.calls).toHaveLength(1);
    });
    await waitFor(() => {
      expect(
        screen.getByText(/csv export saved in zucchini-csv-export-20260330/i)
      ).toBeInTheDocument();
    });
  });

  it("opens the latest auto backup restore preview", async () => {
    const habits = setHabitsApi({
      getLatestAutoBackupRestorePreview: vi.fn(() =>
        Promise.resolve(createRestorePreview())
      ),
    });

    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /restore latest/i }));

    await expect(
      screen.findByText(/this replaces current local data/i)
    ).resolves.toBeInTheDocument();
    expect(habits.getLatestAutoBackupRestorePreview).toHaveBeenCalledOnce();
    expect(
      screen.getByText(/zucchini-auto-20260330-120000\.db/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Habits in backup")).toBeInTheDocument();
    expect(screen.getByText("Plan top task")).toBeInTheDocument();
    expect(screen.getByText("6500 steps")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("refreshes the latest auto backup preview each time", async () => {
    const habits = setHabitsApi({
      getLatestAutoBackupRestorePreview: vi
        .fn()
        .mockResolvedValueOnce(createRestorePreview({ fileName: "old.db" }))
        .mockResolvedValueOnce(createRestorePreview({ fileName: "new.db" })),
    });

    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /restore latest/i }));
    await expect(screen.findByText(/old\.db/i)).resolves.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    fireEvent.click(screen.getByRole("button", { name: /restore latest/i }));

    await expect(screen.findByText(/new\.db/i)).resolves.toBeInTheDocument();
    expect(habits.getLatestAutoBackupRestorePreview).toHaveBeenCalledTimes(2);
  });

  it("chooses a backup file and opens the restore preview", async () => {
    setHabitsApi({
      chooseBackupForRestore: vi.fn(() =>
        Promise.resolve(
          createRestorePreview({
            fileName: "manual-backup.db",
            restoreId: "manual-restore",
            source: "file",
          })
        )
      ),
    });

    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /choose backup/i }));

    await expect(
      screen.findByText(/manual-backup\.db/i)
    ).resolves.toBeInTheDocument();
    expect(screen.getByText(/chosen file/i)).toBeInTheDocument();
  });

  it("restores a backup from the preview dialog", async () => {
    const habits = setHabitsApi({
      getLatestAutoBackupRestorePreview: vi.fn(() =>
        Promise.resolve(createRestorePreview())
      ),
    });

    renderCard();

    fireEvent.click(
      await screen.findByRole("button", { name: /restore latest/i })
    );
    const restoreButton = await screen.findByRole("button", {
      name: /restore and restart/i,
    });

    expect(restoreButton).toBeEnabled();
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(habits.restoreBackup).toHaveBeenCalledWith("restore-1");
    });
  });

  it("shows the no-auto-backup state", async () => {
    setHabitsApi({
      getLatestAutoBackupRestorePreview: vi.fn(() => Promise.resolve(null)),
    });

    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /restore latest/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/no auto backup yet/i)).toHaveLength(2);
    });
  });

  it("shows an error when backup preview fails", async () => {
    setHabitsApi({
      chooseBackupForRestore: vi.fn(() =>
        Promise.reject(new Error("invalid backup"))
      ),
    });

    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /choose backup/i }));

    await expect(
      screen.findByText(/invalid backup/i)
    ).resolves.toBeInTheDocument();
  });

  it("warns before clearing local data", async () => {
    const habits = setHabitsApi();
    localStorage.setItem(
      "zucchini_last_state",
      JSON.stringify({ stale: true })
    );

    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /clear data/i }));

    await expect(
      screen.findByText(/this permanently deletes local data/i)
    ).resolves.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /clear data and restart/i })
    );

    await waitFor(() => {
      expect(habits.clearData.mock.calls).toHaveLength(1);
    });
    expect(localStorage.getItem("zucchini_last_state")).toBeNull();
  });

  it("updates auto backup cadence", () => {
    setHabitsApi();
    const onChange = vi.fn();

    renderCard({ onChange });

    fireEvent.change(screen.getByLabelText(/auto backup cadence/i), {
      target: { value: "daily" },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ autoBackupCadence: "daily" })
    );
  });

  it("opens the auto backup folder from settings", async () => {
    const habits = setHabitsApi();

    renderCard();

    fireEvent.click(
      screen.getByRole("button", { name: /open backup folder/i })
    );

    await waitFor(() => {
      expect(habits.openAutoBackupFolder.mock.calls).toHaveLength(1);
    });
  });
});
