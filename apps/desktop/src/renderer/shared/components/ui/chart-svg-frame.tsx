import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(defaultSize);

  useEffect(() => {
    const element = containerRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateSize = ({ height, width }: DOMRectReadOnly) => {
      if (height > 0 && width > 0) {
        setSize({ height, width });
      }
    };

    updateSize(element.getBoundingClientRect());

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        updateSize(entry.contentRect);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

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
        role="img"
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        {children({ size })}
      </svg>
      {overlay?.({ size })}
    </div>
  );
}
