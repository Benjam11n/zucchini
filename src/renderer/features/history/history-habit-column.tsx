import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import { microTransition } from "@/renderer/lib/motion";
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
  return (
    <Card className="border-border/60 bg-card/85">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className={iconClassName} />
          {title}
        </div>
        <div className="space-y-2">
          {habits.length > 0 ? (
            habits.map((habit) => (
              <motion.div
                key={habit.id}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2"
                initial={{ opacity: 0, x: initialX }}
                transition={microTransition}
              >
                <span className="text-sm text-foreground">{habit.name}</span>
                <Badge
                  className={HABIT_CATEGORY_UI[habit.category].badgeClassName}
                  variant="outline"
                >
                  {habit.category}
                </Badge>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
