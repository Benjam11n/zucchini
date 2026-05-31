import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";

interface WeeklyReviewChartCardProps {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}

export function WeeklyReviewChartCard({
  action,
  children,
  title,
}: WeeklyReviewChartCardProps) {
  return (
    <Card>
      <CardHeader
        className={
          action
            ? "has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto] sm:items-center"
            : undefined
        }
      >
        <CardTitle>{title}</CardTitle>
        {action ? (
          <div
            className="justify-self-start sm:justify-self-end"
            data-slot="card-action"
          >
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
