import type { CSSProperties } from "react";

import { Badge } from "@/renderer/shared/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
} from "@/renderer/shared/components/ui/item";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface HistoryHabitListItemProps {
  badgeLabel: string;
  badgeStyle: CSSProperties | undefined;
  habit: HabitWithStatus;
}

export function HistoryHabitListItem({
  badgeLabel,
  badgeStyle,
  habit,
}: HistoryHabitListItemProps) {
  return (
    <Item className="border-border/50 bg-background/60" variant="outline">
      <ItemContent>
        <span className="text-sm text-foreground">{habit.name}</span>
      </ItemContent>
      <ItemActions>
        <Badge style={badgeStyle} variant="outline">
          {badgeLabel}
        </Badge>
      </ItemActions>
    </Item>
  );
}
