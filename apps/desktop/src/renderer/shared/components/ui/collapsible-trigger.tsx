import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import * as React from "react";

export function CollapsibleTrigger(
  props: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>
) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  );
}
