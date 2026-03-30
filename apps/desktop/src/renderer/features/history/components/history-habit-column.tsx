import { LazyMotion, domAnimation, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/renderer/shared/components/ui/badge";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@/renderer/shared/components/ui/item";
import {
  getHabitCategoryUi,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import { microTransition } from "@/renderer/shared/lib/motion";
import type { HabitWithStatus } from "@/shared/domain/habit";

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
      <Card className="border-border/60 bg-card/85">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className={iconClassName} />
            {title}
          </div>
          <ItemGroup className="gap-2">
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
                    <Item
                      className="rounded-xl border-border/50 bg-background/60"
                      variant="outline"
                    >
                      <ItemContent>
                        <span className="text-sm text-foreground">
                          {habit.name}
                        </span>
                      </ItemContent>
                      <ItemActions>
                        <Badge style={ui.badgeStyle} variant="outline">
                          {ui.label}
                        </Badge>
                      </ItemActions>
                    </Item>
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
