import useEmblaCarousel from "embla-carousel-react";
import * as React from "react";

import { CarouselContent } from "@/renderer/shared/components/ui/carousel-content";
import { CarouselContext } from "@/renderer/shared/components/ui/carousel-context";
import { CarouselDotButton } from "@/renderer/shared/components/ui/carousel-dot-button";
import { CarouselIconButton } from "@/renderer/shared/components/ui/carousel-icon-button";
import { CarouselItem } from "@/renderer/shared/components/ui/carousel-item";
import { CarouselOverflowFade } from "@/renderer/shared/components/ui/carousel-overflow-fade";
import type {
  CarouselApi,
  CarouselProps,
} from "@/renderer/shared/components/ui/carousel-types";
import { cn } from "@/renderer/shared/lib/class-names";

function Carousel({
  orientation = "horizontal",
  opts,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const onSelectRef = React.useRef<((emblaApi: CarouselApi) => void) | null>(
    null
  );

  const onSelect = React.useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) {
      return;
    }
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap?.() ?? 0);
  }, []);
  onSelectRef.current = onSelect;

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  React.useEffect(() => {
    if (!api) {
      return;
    }
    const handleSelect = (emblaApi: CarouselApi) => {
      onSelectRef.current?.(emblaApi);
    };

    handleSelect(api);
    api.on("reInit", handleSelect);
    api.on("select", handleSelect);

    return () => {
      api.off("reInit", handleSelect);
      api.off("select", handleSelect);
    };
  }, [api]);

  const contextValue = React.useMemo(
    () => ({
      api,
      canScrollNext,
      canScrollPrev,
      carouselRef,
      opts,
      orientation:
        orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
      scrollNext,
      scrollPrev,
      scrollTo,
      selectedIndex,
    }),
    [
      api,
      canScrollNext,
      canScrollPrev,
      carouselRef,
      opts,
      orientation,
      scrollNext,
      scrollPrev,
      scrollTo,
      selectedIndex,
    ]
  );

  return (
    <CarouselContext.Provider value={contextValue}>
      <section
        onKeyDownCapture={handleKeyDown}
        className={cn("relative min-w-0 max-w-full", className)}
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </section>
    </CarouselContext.Provider>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselDotButton,
  CarouselIconButton,
  CarouselItem,
  CarouselOverflowFade,
};
