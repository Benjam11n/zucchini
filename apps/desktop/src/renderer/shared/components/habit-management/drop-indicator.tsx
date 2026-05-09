import { cn } from "@/renderer/shared/lib/class-names";

interface DropIndicatorProps {
  position: "after" | "before";
  show: boolean;
}

export function DropIndicator({ position, show }: DropIndicatorProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-4 h-0.5 rounded-full bg-primary transition-opacity",
        position === "before" ? "top-0" : "bottom-0",
        show ? "opacity-100" : "opacity-0"
      )}
    />
  );
}
