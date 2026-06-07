import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import { useCarousel } from "@/renderer/shared/components/ui/carousel-context";

export function CarouselIconButton({
  direction,
  label,
}: {
  direction: "next" | "previous";
  label: string;
}) {
  const { scrollNext, scrollPrev } = useCarousel();

  return (
    <Button
      aria-label={label}
      onClick={direction === "previous" ? scrollPrev : scrollNext}
      size="icon-sm"
      type="button"
      variant="outline"
    >
      {direction === "previous" ? (
        <ChevronLeft className="size-4" />
      ) : (
        <ChevronRight className="size-4" />
      )}
    </Button>
  );
}
