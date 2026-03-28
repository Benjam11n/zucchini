// @vitest-environment jsdom

import { render } from "@testing-library/react";
import type { ComponentProps } from "react";

import type * as CarouselModule from "@/renderer/shared/ui/carousel";
import type { HistoryDay } from "@/shared/domain/history";

import { TodayHistoryCarousel } from "./today-history-carousel";

const carouselSpy = vi.fn();

vi.mock<typeof CarouselModule>(import("@/renderer/shared/ui/carousel"), () => ({
  Carousel: ({
    children,
    opts,
  }: ComponentProps<typeof CarouselModule.Carousel>) => {
    carouselSpy(opts);
    return <div>{children}</div>;
  },
  CarouselContent: ({
    children,
  }: ComponentProps<typeof CarouselModule.CarouselContent>) => (
    <div>{children}</div>
  ),
  CarouselItem: ({
    children,
  }: ComponentProps<typeof CarouselModule.CarouselItem>) => (
    <div>{children}</div>
  ),
}));

vi.mock(
  import("@/renderer/features/history/components/history-day-panel"),
  () => ({
    HistoryDayPanel: () => <div>history day</div>,
  })
);

function createHistoryDay(offset: number): HistoryDay {
  const day = String(14 - offset).padStart(2, "0");
  const date = `2026-03-${day}`;

  return {
    categoryProgress: [],
    date,
    habits: [],
    summary: {
      allCompleted: false,
      completedAt: null,
      date,
      freezeUsed: false,
      streakCountAfterDay: 0,
    },
  };
}

describe("today history carousel", () => {
  it("starts scrolled to the newest visible day", () => {
    carouselSpy.mockClear();

    render(
      <TodayHistoryCarousel
        history={Array.from({ length: 5 }, (_, index) =>
          createHistoryDay(index)
        )}
        todayDate="2026-03-14"
      />
    );

    expect(carouselSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        startIndex: 4,
      })
    );
  });
});
