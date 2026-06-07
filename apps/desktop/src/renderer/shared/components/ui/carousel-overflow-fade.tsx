import { useCarousel } from "@/renderer/shared/components/ui/carousel-context";

export function CarouselOverflowFade({
  className,
  side,
}: {
  className: string;
  side: "next" | "previous";
}) {
  const { canScrollNext, canScrollPrev } = useCarousel();
  const isVisible = side === "previous" ? canScrollPrev : canScrollNext;

  return isVisible ? <div aria-hidden="true" className={className} /> : null;
}
