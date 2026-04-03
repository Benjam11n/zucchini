// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

import { createIdleFocusTimerState } from "@/renderer/features/focus/lib/focus-timer-state";
import type { FocusSession } from "@/shared/domain/focus-session";

import { FocusSessionList, getFocusTodaySummary } from "./focus-session-list";

function createFocusSession(
  id: number,
  completedDate: string,
  durationSeconds = 1500,
  startedAt = `${completedDate}T09:00:00.000Z`,
  completedAt = `${completedDate}T09:25:00.000Z`,
  overrides: Partial<FocusSession> = {}
): FocusSession {
  return {
    completedAt,
    completedDate,
    durationSeconds,
    entryKind: "completed",
    id,
    startedAt,
    timerSessionId: `timer-session-${id}`,
    ...overrides,
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

  it("renders grouped focus runs with compact cards and expandable details", () => {
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
            "2026-03-08T10:20:00.000Z",
            {
              entryKind: "partial",
              timerSessionId: "timer-session-grouped",
            }
          ),
          createFocusSession(
            2,
            "2026-03-08",
            1500,
            "2026-03-08T09:30:00.000Z",
            "2026-03-08T09:55:00.000Z",
            {
              timerSessionId: "timer-session-grouped",
            }
          ),
          createFocusSession(
            1,
            "2026-03-08",
            1500,
            "2026-03-08T09:00:00.000Z",
            "2026-03-08T09:25:00.000Z",
            {
              timerSessionId: "timer-session-grouped",
            }
          ),
        ],
        sessionsLoadError: null,
        timerState: createIdleFocusTimerState(),
        todayDate: "2026-03-08",
      })
    );

    const sessionListCard = screen
      .getByText("Recent focus sessions")
      .closest("[data-slot='card']") as HTMLElement;

    expect(sessionListCard).toHaveTextContent(
      /2 completed loops today[\s\S]*70 focused minutes[\s\S]*80 min session window[\s\S]*2 completed loops[\s\S]*Interrupted/
    );
    expect(sessionListCard).toHaveTextContent(/Show details/);
    expect(screen.getAllByLabelText("5 minute break")).toHaveLength(2);
    expect(screen.queryByText("5m gap")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show details" }));

    const sessionCard = screen.getByTestId("focus-session-card");

    expect(sessionCard).toHaveTextContent(
      /Hide details[\s\S]*25 min[\s\S]*5m gap[\s\S]*Partial · 20 min/
    );
  });

  it("shows paused time with a distinct timeline segment label", () => {
    render(
      createElement(FocusSessionList, {
        onRetryLoad: vi.fn(),
        phase: "ready",
        sessions: [
          createFocusSession(
            1,
            "2026-03-08",
            1500,
            "2026-03-08T09:00:00.000Z",
            "2026-03-08T09:35:00.000Z"
          ),
        ],
        sessionsLoadError: null,
        timerState: createIdleFocusTimerState(),
        todayDate: "2026-03-08",
      })
    );

    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByLabelText("10 minute pause")).toBeInTheDocument();
  });

  it("keeps newer sessions before older sessions", () => {
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
            "2026-03-08T09:25:00.000Z",
            {
              timerSessionId: "timer-session-newer",
            }
          ),
          createFocusSession(
            1,
            "2026-03-07",
            1500,
            "2026-03-07T09:00:00.000Z",
            "2026-03-07T09:25:00.000Z",
            {
              timerSessionId: "timer-session-older",
            }
          ),
        ],
        sessionsLoadError: null,
        timerState: createIdleFocusTimerState(),
        todayDate: "2026-03-08",
      })
    );

    const sessionCards = screen.getAllByTestId("focus-session-card");

    expect(sessionCards[0]).toHaveAttribute("data-session-date", "2026-03-08");
    expect(sessionCards[1]).toHaveAttribute("data-session-date", "2026-03-07");
  });

  it("renders loading and empty states unchanged", () => {
    const { rerender } = render(
      createElement(FocusSessionList, {
        onRetryLoad: vi.fn(),
        phase: "loading",
        sessions: [],
        sessionsLoadError: null,
        timerState: createIdleFocusTimerState(),
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
        timerState: createIdleFocusTimerState(),
        todayDate: "2026-03-08",
      })
    );

    expect(
      screen.getByText("No completed focus sessions yet.")
    ).toBeInTheDocument();
  });
});
