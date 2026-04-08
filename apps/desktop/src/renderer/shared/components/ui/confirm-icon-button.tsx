import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/renderer/shared/components/ui/button";

interface ConfirmIconButtonProps {
  confirmLabel: string;
  icon: ReactNode;
  idleLabel: string;
  onConfirm: () => Promise<void> | void;
  resetKey?: string | number;
  size?: "icon" | "icon-lg" | "icon-sm" | "icon-xs" | "sm";
  variant?: "destructive" | "ghost" | "outline" | "secondary";
}

export function ConfirmIconButton({
  confirmLabel,
  icon,
  idleLabel,
  onConfirm,
  resetKey,
  size = "icon-sm",
  variant = "destructive",
}: ConfirmIconButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setIsConfirming(false);
  }, [resetKey]);

  return (
    <Button
      aria-label={isConfirming ? confirmLabel : idleLabel}
      onBlur={() => {
        setIsConfirming(false);
      }}
      onClick={async () => {
        if (!isConfirming) {
          setIsConfirming(true);
          return;
        }

        await onConfirm();
        setIsConfirming(false);
      }}
      size={size}
      type="button"
      variant={variant}
    >
      {isConfirming ? <X className="size-3.5" /> : icon}
    </Button>
  );
}
