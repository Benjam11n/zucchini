import { useEffect, useRef, useState } from "react";
import type * as React from "react";

import { cn } from "@/renderer/shared/lib/class-names";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface TextWithTooltipProps extends React.ComponentProps<"span"> {
  content: string;
}

export function TextWithTooltip({
  className,
  content,
  ...props
}: TextWithTooltipProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) {
      return;
    }

    const updateTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    };

    updateTruncation();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateTruncation);

      return () => window.removeEventListener("resize", updateTruncation);
    }

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const text = (
    <span ref={textRef} className={cn("block truncate", className)} {...props}>
      {content}
    </span>
  );

  if (!isTruncated) {
    return text;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{text}</TooltipTrigger>
        <TooltipContent className="max-w-sm leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
