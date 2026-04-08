// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { FocusQuotaGoalsCard } from "./focus-quota-goals-card";

function createAsyncMock() {
  return vi.fn(() => Promise.resolve());
}

describe("FocusQuotaGoalsCard", () => {
  it("submits a new weekly focus quota goal", async () => {
    const onSaveGoal = createAsyncMock();

    render(
      <FocusQuotaGoalsCard
        focusQuotaGoals={[]}
        onArchiveGoal={createAsyncMock()}
        onSaveGoal={onSaveGoal}
      />
    );

    fireEvent.change(screen.getByLabelText("Weekly focus quota in minutes"), {
      target: { value: "180" },
    });
    const [addButton] = screen.getAllByRole("button", { name: "Add" });
    if (!addButton) {
      throw new Error("Expected weekly add button.");
    }
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onSaveGoal).toHaveBeenCalledWith("weekly", 180);
    });
  });

  it("does not submit invalid quota values", async () => {
    const onSaveGoal = createAsyncMock();

    render(
      <FocusQuotaGoalsCard
        focusQuotaGoals={[]}
        onArchiveGoal={createAsyncMock()}
        onSaveGoal={onSaveGoal}
      />
    );

    fireEvent.change(screen.getByLabelText("Weekly focus quota in minutes"), {
      target: { value: "10" },
    });
    const [addButton] = screen.getAllByRole("button", { name: "Add" });
    if (!addButton) {
      throw new Error("Expected weekly add button.");
    }
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onSaveGoal).not.toHaveBeenCalled();
    });
  });

  it("requires a second click to archive an existing goal", async () => {
    const onArchiveGoal = createAsyncMock();

    render(
      <FocusQuotaGoalsCard
        focusQuotaGoals={[
          {
            archivedAt: null,
            createdAt: "2026-04-01T00:00:00.000Z",
            currentMinutes: 30,
            frequency: "weekly",
            id: 7,
            isArchived: false,
            targetMinutes: 180,
          },
        ]}
        onArchiveGoal={onArchiveGoal}
        onSaveGoal={createAsyncMock()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Archive Weekly focus quota" })
    );
    expect(onArchiveGoal).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirm archive Weekly focus quota",
      })
    );

    await waitFor(() => {
      expect(onArchiveGoal).toHaveBeenCalledWith(7);
    });
  });
});
