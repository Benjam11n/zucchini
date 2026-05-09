import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

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
  const [confirmationState, setConfirmationState] = useState({
    isConfirming: false,
    resetKey,
  });
  const isConfirming =
    confirmationState.resetKey === resetKey && confirmationState.isConfirming;

  return (
    <Button
      aria-label={isConfirming ? confirmLabel : idleLabel}
      onBlur={() => {
        setConfirmationState({ isConfirming: false, resetKey });
      }}
      onClick={async () => {
        if (!isConfirming) {
          setConfirmationState({ isConfirming: true, resetKey });
          return;
        }

        await onConfirm();
        setConfirmationState({ isConfirming: false, resetKey });
      }}
      size={size}
      type="button"
      variant={variant}
    >
      {isConfirming ? <X className="size-3.5" /> : icon}
    </Button>
  );
}
