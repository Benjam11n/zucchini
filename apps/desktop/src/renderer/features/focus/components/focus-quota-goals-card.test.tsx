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
});
