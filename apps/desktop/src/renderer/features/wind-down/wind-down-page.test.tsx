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
});
