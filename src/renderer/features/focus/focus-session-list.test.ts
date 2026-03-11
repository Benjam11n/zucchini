// @vitest-environment jsdom

import type { FocusSession } from "@/shared/domain/focus-session";

import { getFocusTodaySummary } from "./focus-session-list";

function createFocusSession(
  id: number,
  completedDate: string,
  durationSeconds = 1500
): FocusSession {
  return {
    completedAt: `${completedDate}T09:25:00.000Z`,
    completedDate,
    durationSeconds,
    id,
    startedAt: `${completedDate}T09:00:00.000Z`,
  };
}

describe("focus session list", () => {
  it("summarizes today's completed sessions", () => {
    expect(
      getFocusTodaySummary(
        [
          createFocusSession(1, "2026-03-08"),
          createFocusSession(2, "2026-03-08", 3000),
          createFocusSession(3, "2026-03-07"),
        ],
        "2026-03-08"
      )
    ).toStrictEqual({
      completedCount: 2,
      totalMinutes: 75,
    });
  });
});
