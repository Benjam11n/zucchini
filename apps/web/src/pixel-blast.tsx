import { useRef } from "react";
import type { CSSProperties } from "react";

import "./pixel-blast.css";
import { usePixelBlastRenderer } from "./pixel-blast-renderer";
import type { PixelBlastRendererOptions } from "./pixel-blast-renderer";

interface PixelBlastProps extends PixelBlastRendererOptions {
  className?: string;
  style?: CSSProperties;
}

export default function PixelBlast({
  className,
  style,
  ...rendererOptions
}: PixelBlastProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  usePixelBlastRenderer(containerRef, rendererOptions);

  return (
    <div
      ref={containerRef}
      aria-label="PixelBlast interactive background"
      className={`pixel-blast-container ${className ?? ""}`.trim()}
      style={style}
    />
  );
}
