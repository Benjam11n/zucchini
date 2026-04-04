import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import type { ElementType } from "react";

import { cn } from "@/renderer/shared/lib/class-names";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";

import { Card, CardContent } from "./card";

interface StatCardProps {
  animatedValue?: boolean;
  className?: string;
  color?: string;
  contentClassName?: string;
  icon: ElementType;
  iconContainerClassName?: string;
  label: string;
  size?: "md" | "sm";
  suffix?: string;
  value: number | string;
  valueKey?: string;
}

const SIZE_STYLES = {
  md: {
    card: "",
    content: "flex items-center gap-3",
    icon: "rounded-md border p-2",
    iconSize: "size-4",
    label: "text-xs uppercase tracking-wide text-muted-foreground",
    value: "text-base leading-none font-semibold",
  },
  sm: {
    card: "py-2",
    content: "flex items-center gap-2 px-3",
    icon: "rounded-md border p-1",
    iconSize: "size-3",
    label: "text-[0.6rem] uppercase tracking-wide text-muted-foreground",
    value: "text-xs leading-none font-semibold",
  },
} as const;

export function StatCard({
  animatedValue = false,
  className,
  color,
  contentClassName,
  icon: Icon,
  iconContainerClassName,
  label,
  size = "md",
  suffix,
  value,
  valueKey,
}: StatCardProps) {
  const sizeStyles = SIZE_STYLES[size];
  const iconStyle = color
    ? {
        style: {
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
          color,
        },
      }
    : {};
  const valueStyle = color ? { style: { color } } : {};

  return (
    <LazyMotion features={domAnimation}>
      <m.div whileHover={hoverLift} whileTap={tapPress}>
        <Card className={cn(sizeStyles.card, className)} size="sm">
          <CardContent className={cn(sizeStyles.content, contentClassName)}>
            <span
              className={cn(sizeStyles.icon, iconContainerClassName)}
              {...iconStyle}
            >
              <Icon className={sizeStyles.iconSize} />
            </span>
            <div className="space-y-0.5">
              {animatedValue ? (
                <AnimatePresence initial={false} mode="popLayout">
                  <m.p
                    key={valueKey ?? `${label}-${value}`}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(sizeStyles.value)}
                    exit={{ opacity: 0, y: -8 }}
                    initial={{ opacity: 0, y: 8 }}
                    transition={microTransition}
                    {...valueStyle}
                  >
                    {value}
                    {suffix}
                  </m.p>
                </AnimatePresence>
              ) : (
                <p className={cn(sizeStyles.value)} {...valueStyle}>
                  {value}
                  {suffix}
                </p>
              )}
              <p className={cn(sizeStyles.label)}>{label}</p>
            </div>
          </CardContent>
        </Card>
      </m.div>
    </LazyMotion>
  );
}
