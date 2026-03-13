// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { createElement } from "react";

import type { FocusSession } from "@/shared/domain/focus-session";

import { FocusSessionList, getFocusTodaySummary } from "./focus-session-list";

function createFocusSession(
  id: number,
  completedDate: string,
  durationSeconds = 1500,
  startedAt = `${completedDate}T09:00:00.000Z`,
  completedAt = `${completedDate}T09:25:00.000Z`
): FocusSession {
  return {
    completedAt,
    completedDate,
    durationSeconds,
    id,
    startedAt,
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

  it("rounds sub-minute totals up to a whole minute", () => {
    expect(
      getFocusTodaySummary(
        [createFocusSession(1, "2026-03-08", 1)],
        "2026-03-08"
      )
    ).toStrictEqual({
      completedCount: 1,
      totalMinutes: 1,
    });
  });

  it("returns integer minute totals instead of floats", () => {
    expect(
      getFocusTodaySummary(
        [
          createFocusSession(1, "2026-03-08", 30),
          createFocusSession(2, "2026-03-08", 60),
          createFocusSession(3, "2026-03-08", 90),
        ],
        "2026-03-08"
      )
    ).toStrictEqual({
      completedCount: 3,
      totalMinutes: 3,
    });
  });

  it("renders grouped focus runs with timeline-backed session details", () => {
    render(
      createElement(FocusSessionList, {
        onRetryLoad: vi.fn(),
        phase: "ready",
        sessions: [
          createFocusSession(
            3,
            "2026-03-08",
            1200,
            "2026-03-08T10:00:00.000Z",
            "2026-03-08T10:20:00.000Z"
          ),
          createFocusSession(
            2,
            "2026-03-08",
            1500,
            "2026-03-08T09:30:00.000Z",
            "2026-03-08T09:55:00.000Z"
          ),
          createFocusSession(
            1,
            "2026-03-08",
            1500,
            "2026-03-08T09:00:00.000Z",
            "2026-03-08T09:25:00.000Z"
          ),
        ],
        sessionsLoadError: null,
        todayDate: "2026-03-08",
      })
    );

    const sessionListCard = screen
      .getByText("Recent focus runs")
      .closest("[data-slot='card']") as HTMLElement;

    expect(sessionListCard).toHaveTextContent(
      /3 sessions today[\s\S]*1h 20m window[\s\S]*3 sessions/
    );
    expect(sessionListCard).toHaveTextContent(
      /25 min[\s\S]*25 min[\s\S]*5m gap[\s\S]*20 min/
    );
    expect(screen.getAllByText("70 focused minutes")).toHaveLength(2);
    expect(screen.getAllByText("25 min")).toHaveLength(2);
    expect(
      screen.getByLabelText("Focus timeline for 3 sessions")
    ).toBeInTheDocument();
  });

  it("keeps newer runs before older runs", () => {
    render(
      createElement(FocusSessionList, {
        onRetryLoad: vi.fn(),
        phase: "ready",
        sessions: [
          createFocusSession(
            2,
            "2026-03-08",
            1500,
            "2026-03-08T09:00:00.000Z",
            "2026-03-08T09:25:00.000Z"
          ),
          createFocusSession(
            1,
            "2026-03-07",
            1500,
            "2026-03-07T09:00:00.000Z",
            "2026-03-07T09:25:00.000Z"
          ),
        ],
        sessionsLoadError: null,
        todayDate: "2026-03-08",
      })
    );

    const runCards = screen.getAllByTestId("focus-run-card");

    expect(runCards[0]).toHaveAttribute("data-run-date", "2026-03-08");
    expect(runCards[1]).toHaveAttribute("data-run-date", "2026-03-07");
  });

  it("renders loading and empty states unchanged", () => {
    const { rerender } = render(
      createElement(FocusSessionList, {
        onRetryLoad: vi.fn(),
        phase: "loading",
        sessions: [],
        sessionsLoadError: null,
        todayDate: "2026-03-08",
      })
    );

    expect(
      screen.getByText("Loading recent focus sessions...")
    ).toBeInTheDocument();

    rerender(
      createElement(FocusSessionList, {
        onRetryLoad: vi.fn(),
        phase: "ready",
        sessions: [],
        sessionsLoadError: null,
        todayDate: "2026-03-08",
      })
    );

    expect(
      screen.getByText("No completed focus sessions yet.")
    ).toBeInTheDocument();
  });
});
