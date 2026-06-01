import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";

interface SettingsCardHeaderProps {
  action?: ReactNode;
  description: string;
  icon?: LucideIcon;
  title: string;
}

export function SettingsCardHeader({
  action,
  description,
  icon: Icon,
  title,
}: SettingsCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-primary" /> : null}
        <CardTitle>{title}</CardTitle>
      </div>
      {action ? <div data-slot="card-action">{action}</div> : null}
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
