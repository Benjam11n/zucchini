// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createDefaultAppSettings } from "@/shared/domain/settings";
import { createFramerMotionMock } from "@/test/fixtures/framer-motion-mock";

import { WindDownPage } from "./wind-down-page";

vi.mock(import("framer-motion"), (importOriginal) =>
  createFramerMotionMock(importOriginal)
);

function createAsyncMock() {
  return vi.fn(() => Promise.resolve());
}

describe("WindDownPage", () => {
  it("submits a new wind down action", async () => {
    const onCreateAction = createAsyncMock();

    render(
      <WindDownPage
        onCreateAction={onCreateAction}
        onDeleteAction={createAsyncMock()}
        onRenameAction={createAsyncMock()}
        onToggleAction={vi.fn()}
        state={{
          date: "2026-04-04",
          dayStatus: null,
          focusMinutes: 0,
          habits: [],
          settings: createDefaultAppSettings("Asia/Singapore"),
          streak: {
            availableFreezes: 0,
            bestStreak: 0,
            currentStreak: 0,
            lastEvaluatedDate: null,
          },
          windDown: {
            actions: [],
            completedCount: 0,
            date: "2026-04-04",
            isComplete: false,
            totalCount: 0,
          },
        }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Read a book..."), {
      target: { value: "Stretch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add action" }));

    await waitFor(() => {
      expect(onCreateAction).toHaveBeenCalledWith("Stretch");
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Read a book...")).toHaveValue("");
    });
  });

  it("requires a second click to delete a wind down action", async () => {
    const onDeleteAction = createAsyncMock();

    render(
      <WindDownPage
        onCreateAction={createAsyncMock()}
        onDeleteAction={onDeleteAction}
        onRenameAction={createAsyncMock()}
        onToggleAction={vi.fn()}
        state={{
          date: "2026-04-04",
          dayStatus: null,
          focusMinutes: 0,
          habits: [],
          settings: createDefaultAppSettings("Asia/Singapore"),
          streak: {
            availableFreezes: 0,
            bestStreak: 0,
            currentStreak: 0,
            lastEvaluatedDate: null,
          },
          windDown: {
            actions: [
              {
                completed: false,
                completedAt: null,
                createdAt: "2026-04-04T00:00:00.000Z",
                id: 3,
                name: "Stretch",
                sortOrder: 0,
              },
            ],
            completedCount: 0,
            date: "2026-04-04",
            isComplete: false,
            totalCount: 1,
          },
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Stretch" }));
    expect(onDeleteAction).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm delete Stretch" })
    );

    await waitFor(() => {
      expect(onDeleteAction).toHaveBeenCalledWith(3);
    });
  });
});
