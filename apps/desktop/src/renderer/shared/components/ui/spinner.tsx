import { Loader2Icon } from "lucide-react";

import { cn } from "@/renderer/shared/lib/class-names";

function Spinner({ className, ...props }: React.ComponentProps<"output">) {
  return (
    <output aria-label="Loading" {...props}>
      <Loader2Icon
        aria-hidden="true"
        className={cn("size-4 animate-spin", className)}
      />
    </output>
  );
}

export { Spinner };
