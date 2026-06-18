import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
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
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const refreshTruncation = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, []);
  const onResize = useEffectEvent(() => {
    refreshTruncation();
  });
  const textRef = useCallback(
    (nextElement: HTMLSpanElement | null) => {
      elementRef.current = nextElement;
      refreshTruncation();
    },
    [refreshTruncation]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", onResize);

      return () => window.removeEventListener("resize", onResize);
    }

    const observer = new ResizeObserver(onResize);
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
