import type { Download } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
} from "@/renderer/shared/components/ui/item";

interface DataActionItemProps {
  description: string;
  disabled: boolean;
  icon: typeof Download;
  label: string;
  onClick: () => Promise<void> | void;
  variant?: "destructive" | "outline";
}

export function DataActionItem({
  description,
  disabled,
  icon: Icon,
  label,
  onClick,
  variant = "outline",
}: DataActionItemProps) {
  return (
    <Item className="py-2">
      <ItemContent>
        <p className="text-sm font-medium">{label}</p>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          disabled={disabled}
          onClick={() => {
            void onClick();
          }}
          size="sm"
          variant={variant}
        >
          <Icon className="size-4" />
          {label}
        </Button>
      </ItemActions>
    </Item>
  );
}
