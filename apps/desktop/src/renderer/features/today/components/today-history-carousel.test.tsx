// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
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
      />
    );

    expect(screen.getByRole("button", { name: /wed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thu/i })).toBeInTheDocument();
  });

  it("renders nothing when no history is available", () => {
    const { container } = render(
      <TodayHistoryCarousel hasLoadedHistorySummary history={[]} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
