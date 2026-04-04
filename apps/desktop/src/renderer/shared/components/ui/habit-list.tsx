import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { Progress } from "@/renderer/shared/components/ui/progress";

interface HabitListCardProps {
  title: string;
  icon?: LucideIcon;
  description?: ReactNode;
  headerActions?: ReactNode;
  progressValue?: number;
  progressLabel?: ReactNode;
  children: ReactNode;
}

export function HabitListCard({
  title,
  icon: Icon,
  description,
  headerActions,
  progressValue,
  progressLabel,
  children,
}: HabitListCardProps) {
  return (
    <LazyMotion features={domAnimation}>
      <Card>
        <CardHeader className="gap-2 pb-4">
          <div className="flex items-start justify-between">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="size-5 text-primary" />}
                <CardTitle className="text-base font-medium">{title}</CardTitle>
              </div>
              {description && (
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerActions || progressLabel ? (
              <div className="flex shrink-0 flex-col items-end gap-2">
                {headerActions}
                {progressLabel && (
                  <AnimatePresence initial={false} mode="popLayout">
                    <m.span
                      key={String(progressLabel)}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-muted-foreground tabular-nums"
                      exit={{ opacity: 0, y: -8 }}
                      initial={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {progressLabel}
                    </m.span>
                  </AnimatePresence>
                )}
              </div>
            ) : null}
          </div>
          {progressValue !== undefined && (
            <Progress className="h-1 mt-1" value={progressValue} />
          )}
        </CardHeader>
        <CardContent className="grid gap-6 pt-1">{children}</CardContent>
      </Card>
    </LazyMotion>
  );
}

export { HabitListItem } from "./habit-list-item";
