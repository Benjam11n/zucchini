import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from "@/components/ui/item";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface HistoryHabitColumnProps {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
  emptyLabel: string;
  habits: HabitWithStatus[];
}

export function HistoryHabitColumn({
  title,
  icon: Icon,
  iconClassName,
  emptyLabel,
  habits,
}: HistoryHabitColumnProps) {
  return (
    <Card className="border-border/60 bg-card/85">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className={iconClassName} />
          {title}
        </div>
        <ItemGroup className="gap-2">
          {habits.length > 0 ? (
            habits.map((habit) => (
              <div key={habit.id}>
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
                    <Badge
                      className={
                        HABIT_CATEGORY_UI[habit.category].badgeClassName
                      }
                      variant="outline"
                    >
                      {habit.category}
                    </Badge>
                  </ItemActions>
                </Item>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          )}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
