import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";

function getDocumentTheme(): NonNullable<ToasterProps["theme"]> {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const TOASTER_STYLE = {
  "--border-radius": "var(--radius)",
  "--normal-bg": "var(--popover)",
  "--normal-border": "var(--border)",
  "--normal-text": "var(--popover-foreground)",
} as CSSProperties;

export function Toaster(props: ToasterProps) {
  const [theme, setTheme] =
    useState<NonNullable<ToasterProps["theme"]>>(getDocumentTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getDocumentTheme());
    });

    observer.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributes: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Sonner
      className="toaster group"
      icons={{
        error: <OctagonXIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        success: <CircleCheckIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
      }}
      position="bottom-left"
      theme={theme}
      toastOptions={{
        classNames: {
          actionButton:
            "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "rounded-md border border-border bg-card text-card-foreground hover:bg-accent",
          closeButton:
            "border border-border bg-card text-muted-foreground hover:text-foreground",
          description: "!text-card-foreground/85",
          toast:
            "border border-border/80 bg-card text-card-foreground shadow-lg",
        },
      }}
      style={TOASTER_STYLE}
      {...props}
    />
  );
}
