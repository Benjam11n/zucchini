/**
 * Focus widget position and size clamping.
 *
 * Ensures the floating widget window stays within the visible screen
 * work area with a configurable margin. Provides default bounds and
 * a clamp function that repositions/resizes if the widget would
 * overflow the display.
 */
import { screen } from "electron";

export const FOCUS_WIDGET_DEFAULT_HEIGHT = 48;
export const FOCUS_WIDGET_DEFAULT_WIDTH = 188;
const FOCUS_WIDGET_MARGIN = 12;

export interface FocusWidgetBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

export function getDefaultFocusWidgetBounds(): FocusWidgetBounds {
  const { workArea } = screen.getPrimaryDisplay();

  return {
    height: FOCUS_WIDGET_DEFAULT_HEIGHT,
    width: FOCUS_WIDGET_DEFAULT_WIDTH,
    x:
      workArea.x +
      workArea.width -
      FOCUS_WIDGET_DEFAULT_WIDTH -
      FOCUS_WIDGET_MARGIN,
    y: workArea.y + FOCUS_WIDGET_MARGIN,
  };
}

export function clampFocusWidgetBounds(
  bounds: FocusWidgetBounds
): FocusWidgetBounds {
  const { workArea } = screen.getDisplayMatching(bounds);
  const minX = workArea.x + FOCUS_WIDGET_MARGIN;
  const minY = workArea.y + FOCUS_WIDGET_MARGIN;
  const maxX = Math.max(
    minX,
    workArea.x + workArea.width - bounds.width - FOCUS_WIDGET_MARGIN
  );
  const maxY = Math.max(
    minY,
    workArea.y + workArea.height - bounds.height - FOCUS_WIDGET_MARGIN
  );

  return {
    ...bounds,
    x: Math.min(Math.max(bounds.x, minX), maxX),
    y: Math.min(Math.max(bounds.y, minY), maxY),
  };
}
