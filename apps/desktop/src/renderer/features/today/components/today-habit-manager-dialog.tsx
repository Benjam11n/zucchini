import { Settings2 } from "lucide-react";
import { VisuallyHidden } from "radix-ui";
import { useState } from "react";
import type { ReactElement } from "react";

import { HabitManagementContent } from "@/renderer/shared/components/habit-management/habit-management-content";
import type { HabitManagementCardProps } from "@/renderer/shared/components/habit-management/habit-management.types";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/renderer/shared/components/ui/dialog";

interface TodayHabitManagerDialogProps extends HabitManagementCardProps {
  trigger?: ReactElement;
}

export function TodayHabitManagerDialog({
  trigger,
  ...props
}: TodayHabitManagerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerElement = trigger ?? (
    <Button size="sm" type="button" variant="outline">
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
          <VisuallyHidden.Root>
            <DialogDescription>
              Add new habits and adjust names, categories, frequencies, or
              ordering without leaving today&apos;s flow.
            </DialogDescription>
          </VisuallyHidden.Root>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto p-6">
          <div className="grid gap-3">
            <HabitManagementContent {...props} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
