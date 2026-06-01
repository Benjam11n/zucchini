const AUTO_SCROLL_EDGE_THRESHOLD_PX = 72;
const AUTO_SCROLL_MAX_STEP_PX = 18;

function isScrollableElement(element: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(element);
  return (
    /(auto|overlay|scroll)/u.test(overflowY) &&
    element.scrollHeight > element.clientHeight
  );
}

export function findScrollableAncestor(
  element: HTMLElement | null
): HTMLElement | null {
  let current = element?.parentElement ?? null;

  while (current) {
    if (isScrollableElement(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

export function getAutoScrollStep(
  clientY: number,
  top: number,
  bottom: number
): number {
  if (clientY <= top + AUTO_SCROLL_EDGE_THRESHOLD_PX) {
    const distance = Math.max(clientY - top, 0);
    const intensity = 1 - distance / AUTO_SCROLL_EDGE_THRESHOLD_PX;
    return -Math.ceil(intensity * AUTO_SCROLL_MAX_STEP_PX);
  }

  if (clientY >= bottom - AUTO_SCROLL_EDGE_THRESHOLD_PX) {
    const distance = Math.max(bottom - clientY, 0);
    const intensity = 1 - distance / AUTO_SCROLL_EDGE_THRESHOLD_PX;
    return Math.ceil(intensity * AUTO_SCROLL_MAX_STEP_PX);
  }

  return 0;
}
