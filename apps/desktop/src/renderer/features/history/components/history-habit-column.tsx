import { LazyMotion, domAnimation, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { ItemGroup } from "@/renderer/shared/components/ui/item";
import {
  getHabitCategoryUi,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import { microTransition } from "@/renderer/shared/lib/motion";
import type { HabitWithStatus } from "@/shared/domain/habit";

import { HistoryHabitListItem } from "./history-habit-list-item";

interface HistoryHabitColumnProps {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
  emptyLabel: string;
  habits: HabitWithStatus[];
  initialX: number;
}

export function HistoryHabitColumn({
  title,
  icon: Icon,
  iconClassName,
  emptyLabel,
  habits,
  initialX,
}: HistoryHabitColumnProps) {
  const categoryPreferences = useHabitCategoryPreferences();

  return (
    <LazyMotion features={domAnimation}>
      <Card>
        <CardContent>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className={iconClassName} />
            {title}
          </div>
          <ItemGroup className="gap-1">
            {habits.length > 0 ? (
              habits.map((habit) => {
                const ui = getHabitCategoryUi(
                  habit.category,
                  categoryPreferences
                );

                return (
                  <m.div
                    key={habit.id}
                    animate={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: initialX }}
                    transition={microTransition}
                  >
                    <HistoryHabitListItem
                      badgeLabel={ui.label}
                      badgeStyle={ui.badgeStyle}
                      habit={habit}
                    />
                  </m.div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
            )}
          </ItemGroup>
        </CardContent>
      </Card>
    </LazyMotion>
  );
}
