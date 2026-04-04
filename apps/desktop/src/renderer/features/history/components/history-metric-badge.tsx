import { m } from "framer-motion";

import { Badge } from "@/renderer/shared/components/ui/badge";
import { hoverLift, tapPress } from "@/renderer/shared/lib/motion";

interface HistoryMetricBadgeProps {
  className: string;
  label: string;
}

export function HistoryMetricBadge({
  className,
  label,
}: HistoryMetricBadgeProps) {
  return (
    <m.div whileHover={hoverLift} whileTap={tapPress}>
      <Badge className={className} variant="outline">
        {label}
      </Badge>
    </m.div>
  );
}
