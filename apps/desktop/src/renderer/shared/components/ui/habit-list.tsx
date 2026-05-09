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
import { cn } from "@/renderer/shared/lib/class-names";

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
        <CardHeader className="min-w-0 gap-2 pb-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="grid min-w-0 gap-1">
              <div className="flex min-w-0 items-center gap-2">
                {Icon && <Icon className="size-5 text-primary" />}
                <CardTitle className="min-w-0 truncate text-base font-medium">
                  {title}
                </CardTitle>
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

export function HabitListRows({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-px", className)}>{children}</div>;
}

export function HabitListEmptyState({
  action,
  children,
}: {
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-border py-10 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function HabitListItemActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export { HabitListItem } from "./habit-list-item";
