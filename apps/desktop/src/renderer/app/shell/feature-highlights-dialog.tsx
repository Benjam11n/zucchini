import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/renderer/shared/components/ui/carousel";
import type { CarouselApi } from "@/renderer/shared/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/renderer/shared/components/ui/dialog";
import { cn } from "@/renderer/shared/lib/class-names";

interface FeatureSlide {
  description: string;
  eyebrow: string;
  id: string;
  imageAlt: string;
  imageSrc: string;
  title: string;
}

function resolveFeatureAsset(filename: string): string {
  return `${import.meta.env.BASE_URL}features/${filename}`;
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    description: "Track each habit on its own, including individual streaks.",
    eyebrow: "Today",
    id: "habits",
    imageAlt: "Minimal habit checklist feature preview",
    imageSrc: resolveFeatureAsset("feature-habits.webp"),
    title: "Habit-level progress",
  },
  {
    description: "Earn freezes on 7-day and 30-day streak milestones.",
    eyebrow: "Streaks",
    id: "streaks",
    imageAlt: "Minimal streak freeze feature preview",
    imageSrc: resolveFeatureAsset("feature-streaks.webp"),
    title: "Streak freezes",
  },
  {
    description:
      "Customize focus blocks, short breaks, long breaks, and cycles.",
    eyebrow: "Pomodoro",
    id: "focus",
    imageAlt: "Minimal Pomodoro focus feature preview",
    imageSrc: resolveFeatureAsset("feature-focus.webp"),
    title: "Focus rhythm",
  },
  {
    description: "Set daily reminders, snooze timing, and wind-down defaults.",
    eyebrow: "Reminders",
    id: "reminders",
    imageAlt: "Minimal reminders and wind-down feature preview",
    imageSrc: resolveFeatureAsset("feature-reminders.webp"),
    title: "Gentle reminders",
  },
];

function FeaturesCarouselContent() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelectedIndex = () => {
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };

    updateSelectedIndex();
    carouselApi.on("reInit", updateSelectedIndex);
    carouselApi.on("select", updateSelectedIndex);

    return () => {
      carouselApi.off("reInit", updateSelectedIndex);
      carouselApi.off("select", updateSelectedIndex);
    };
  }, [carouselApi]);

  return (
    <section
      aria-label="Feature highlights"
      className="overflow-hidden px-6 pb-6 pt-2"
    >
      <Carousel
        className="min-w-0"
        opts={{ align: "start", loop: true }}
        setApi={setCarouselApi}
      >
        <div className="mb-3 flex justify-end">
          <div className="flex items-center gap-1.5">
            <Button
              aria-label="Previous feature"
              onClick={() => carouselApi?.scrollPrev()}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              aria-label="Next feature"
              onClick={() => carouselApi?.scrollNext()}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <CarouselContent className="-ml-3">
          {FEATURE_SLIDES.map((slide) => (
            <CarouselItem className="basis-full pl-3" key={slide.id}>
              <article className="h-full overflow-hidden rounded-md border border-foreground/10 bg-card text-card-foreground shadow-sm">
                <div className="aspect-square overflow-hidden border-b border-foreground/10 bg-muted">
                  <img
                    alt={slide.imageAlt}
                    className="size-full object-cover"
                    draggable={false}
                    src={slide.imageSrc}
                  />
                </div>
                <div className="grid gap-1 p-3.5">
                  <p className="text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
                    {slide.eyebrow}
                  </p>
                  <h3 className="text-base font-semibold text-foreground">
                    {slide.title}
                  </h3>
                  <p className="text-sm leading-5 text-muted-foreground">
                    {slide.description}
                  </p>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-3 flex justify-center gap-1.5">
          {FEATURE_SLIDES.map((slide, index) => (
            <button
              aria-label={`Show ${slide.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                selectedIndex === index
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/60"
              )}
              key={slide.id}
              onClick={() => carouselApi?.scrollTo(index)}
              type="button"
            />
          ))}
        </div>
      </Carousel>
    </section>
  );
}

export function FeaturesCarouselDialog({ trigger }: { trigger: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[min(92vw,460px)] overflow-hidden">
        <DialogHeader className="gap-0">
          <DialogTitle className="sr-only">Feature highlights</DialogTitle>
          <DialogDescription>
            See how habit streaks, freeze awards, focus sessions, reminders, and
            wind-down settings work.
          </DialogDescription>
        </DialogHeader>
        <FeaturesCarouselContent />
      </DialogContent>
    </Dialog>
  );
}
