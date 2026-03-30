import { Settings2 } from "lucide-react";
import { useState } from "react";
import type { ReactElement } from "react";

import { HabitManagementContent } from "@/renderer/features/settings/components/habits/habit-management-content";
import type { HabitManagementCardProps } from "@/renderer/features/settings/components/habits/habit-management.types";
import { Button } from "@/renderer/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/renderer/shared/ui/dialog";

interface TodayHabitManagerDialogProps extends HabitManagementCardProps {
  trigger?: ReactElement;
}

export function TodayHabitManagerDialog({
  trigger,
  ...props
}: TodayHabitManagerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerElement = trigger ?? (
    <Button className="rounded-full" size="sm" type="button" variant="outline">
      <Settings2 className="size-4" />
      Manage
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>

      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage habits</DialogTitle>
          <DialogDescription className="pb-2">
            Add new habits and adjust names, categories, frequencies, or
            ordering without leaving today&apos;s flow.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 pb-6">
          <div className="grid gap-3">
            <HabitManagementContent {...props} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
