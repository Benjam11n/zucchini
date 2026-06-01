export function getHabitDropPosition(
  bounds: DOMRect,
  clientY: number
): "after" | "before" {
  const midpoint = bounds.top + bounds.height / 2;
  return clientY < midpoint ? "before" : "after";
}
