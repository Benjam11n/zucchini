import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import * as React from "react";

import { CollapsibleContent } from "@/renderer/shared/components/ui/collapsible-content";
import { CollapsibleTrigger } from "@/renderer/shared/components/ui/collapsible-trigger";

function Collapsible(
  props: React.ComponentProps<typeof CollapsiblePrimitive.Root>
) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
