// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { HistorySummaryDay } from "@/shared/domain/history";

import { TodayHistoryCarousel } from "./today-history-carousel";

const carouselRef = vi.fn();
const carouselApi = {
  canScrollNext: () => false,
  canScrollPrev: () => false,
  off: vi.fn(),
  on: vi.fn(),
};

vi.mock("embla-carousel-react", () => ({
  default: () => [carouselRef, carouselApi],
}));

function historyDay(date: string): HistorySummaryDay {
  return {
    categoryProgress: [
      {
        category: "productivity",
        completed: 1,
        progress: 1,
        total: 1,
      },
    ],
    date,
    focusMinutes: 0,
    summary: {
      allCompleted: true,
      completedAt: `${date}T12:00:00.000Z`,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 1,
    },
  };
}

describe("today history carousel", () => {
  it("shows passed history days", () => {
    render(
      <TodayHistoryCarousel
        hasLoadedHistorySummary
        history={[historyDay("2026-03-11"), historyDay("2026-03-12")]}
        onSelectDate={vi.fn()}
        selectedDate={null}
      />
    );

    expect(screen.getByRole("button", { name: /wed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thu/i })).toBeInTheDocument();
  });

  it("renders nothing when no history is available", () => {
    const { container } = render(
      <TodayHistoryCarousel
        hasLoadedHistorySummary
        history={[]}
        onSelectDate={vi.fn()}
        selectedDate={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses the loaded carousel height for the loading skeleton", () => {
    render(
      <TodayHistoryCarousel
        hasLoadedHistorySummary={false}
        history={[]}
        onSelectDate={vi.fn()}
        selectedDate={null}
      />
    );

    expect(screen.getByLabelText("Loading recent history")).toHaveClass("h-28");
  });

  it("selects dates and marks the selected date", () => {
    const onSelectDate = vi.fn();

    render(
      <TodayHistoryCarousel
        hasLoadedHistorySummary
        history={[historyDay("2026-03-11"), historyDay("2026-03-12")]}
        onSelectDate={onSelectDate}
        selectedDate="2026-03-12"
      />
    );

    const selectedButton = screen.getByRole("button", { name: /thu/i });
    fireEvent.click(selectedButton);

    expect(onSelectDate).toHaveBeenCalledWith("2026-03-12");
    expect(selectedButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows status labels for non-complete historical days", () => {
    render(
      <TodayHistoryCarousel
        hasLoadedHistorySummary
        history={[
          {
            ...historyDay("2026-03-11"),
            summary: {
              ...historyDay("2026-03-11").summary,
              allCompleted: false,
              dayStatus: "sick",
            },
          },
          {
            ...historyDay("2026-03-12"),
            summary: {
              ...historyDay("2026-03-12").summary,
              allCompleted: false,
              dayStatus: "rescheduled",
            },
          },
        ]}
        onSelectDate={vi.fn()}
        selectedDate={null}
      />
    );

    expect(screen.getByText("Sick day")).toBeInTheDocument();
    expect(screen.getByText("Moved")).toBeInTheDocument();
  });

  it("shows complete status labels for complete historical days", () => {
    render(
      <TodayHistoryCarousel
        hasLoadedHistorySummary
        history={[historyDay("2026-03-11")]}
        onSelectDate={vi.fn()}
        selectedDate={null}
      />
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
