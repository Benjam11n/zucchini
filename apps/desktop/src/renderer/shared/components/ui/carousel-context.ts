import { createContext, use } from "react";

import type {
  CarouselApi,
  CarouselContextProps,
} from "@/renderer/shared/components/ui/carousel-types";

export const CarouselContext = createContext<CarouselContextProps | null>(null);

export function useCarousel(): CarouselContextProps {
  const context = use(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

export type { CarouselApi, CarouselContextProps };
