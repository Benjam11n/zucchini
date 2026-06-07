import * as React from "react";

import { useCarousel } from "@/renderer/shared/components/ui/carousel-context";
import { cn } from "@/renderer/shared/lib/class-names";

export function CarouselItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      data-slot="carousel-item"
      {...props}
    />
  );
}
