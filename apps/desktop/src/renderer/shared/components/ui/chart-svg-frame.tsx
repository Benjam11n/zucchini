import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { ChartSize } from "./chart-types";

interface ChartSvgRenderState {
  size: ChartSize;
}

interface ChartSvgFrameProps {
  ariaLabel: string;
  children: (state: ChartSvgRenderState) => ReactNode;
  defaultSize: ChartSize;
  overlay?: (state: ChartSvgRenderState) => ReactNode;
}

function useResponsiveChartSize(defaultSize: ChartSize) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState(defaultSize);
  const updateSize = useCallback(({ height, width }: DOMRectReadOnly) => {
    if (height > 0 && width > 0) {
      setSize({ height, width });
    }
  }, []);
  const containerRef = useCallback(
    (nextElement: HTMLDivElement | null) => {
      setElement(nextElement);
      if (nextElement) {
        updateSize(nextElement.getBoundingClientRect());
      }
    },
    [updateSize]
  );

  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        updateSize(entry.contentRect);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, updateSize]);

  return { containerRef, size };
}

export function ChartSvgFrame({
  ariaLabel,
  children,
  defaultSize,
  overlay,
}: ChartSvgFrameProps) {
  const { containerRef, size } = useResponsiveChartSize(defaultSize);

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <svg
        aria-label={ariaLabel}
        className="h-full w-full overflow-visible"
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        {children({ size })}
      </svg>
      {overlay?.({ size })}
    </div>
  );
}
