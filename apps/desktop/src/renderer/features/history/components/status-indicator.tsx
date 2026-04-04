import { CheckCircle2 } from "lucide-react";

export function StatusIndicator({ completed }: { completed: boolean }) {
  return completed ? (
    <CheckCircle2 className="size-3.5" />
  ) : (
    <div className="size-3.5 rounded-full border border-current" />
  );
}
