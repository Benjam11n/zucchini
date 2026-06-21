import { useRef } from "react";
import type { CSSProperties } from "react";

import "./pixel-blast.css";
import { usePixelBlastRenderer } from "./pixel-blast-renderer";

interface PixelBlastProps {
  className?: string;
  style?: CSSProperties;
}

export default function PixelBlast({ className, style }: PixelBlastProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  usePixelBlastRenderer(containerRef);

  return (
    <div
      ref={containerRef}
      aria-label="PixelBlast interactive background"
      className={`pixel-blast-container ${className ?? ""}`.trim()}
      style={style}
    />
  );
}
