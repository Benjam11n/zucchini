import { useCarousel } from "@/renderer/shared/components/ui/carousel-context";
import { cn } from "@/renderer/shared/lib/class-names";

export function CarouselDotButton({
  index,
  label,
}: {
  index: number;
  label: string;
}) {
  const { scrollTo, selectedIndex } = useCarousel();

  return (
    <button
      aria-label={label}
      className={cn(
        "h-1.5 rounded-full transition-all",
        selectedIndex === index
          ? "w-6 bg-primary"
          : "w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/60"
      )}
      onClick={() => scrollTo(index)}
      type="button"
    />
  );
}
