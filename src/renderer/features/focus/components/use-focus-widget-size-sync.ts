import { useEffect } from "react";

export function useFocusWidgetSizeSync(widgetElement: HTMLElement | null) {
  useEffect(() => {
    if (!widgetElement) {
      return;
    }

    let animationFrame = 0;

    const syncSize = () => {
      animationFrame = 0;
      const width = Math.ceil(widgetElement.getBoundingClientRect().width);
      const height = Math.ceil(widgetElement.getBoundingClientRect().height);
      void window.habits.resizeFocusWidget(width, height);
    };

    const scheduleSync = () => {
      if (animationFrame !== 0) {
        return;
      }

      animationFrame = window.requestAnimationFrame(syncSize);
    };

    scheduleSync();

    const resizeObserver = new ResizeObserver(() => {
      scheduleSync();
    });
    resizeObserver.observe(widgetElement);

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
    };
  }, [widgetElement]);
}
