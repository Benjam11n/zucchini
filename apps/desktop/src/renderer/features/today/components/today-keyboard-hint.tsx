import { AnimatePresence, m } from "framer-motion";
import { memo } from "react";

import type { TodayKeyboardHint as TodayKeyboardHintValue } from "@/renderer/features/today/hooks/use-today-keyboard-flow";
import { Kbd, KbdGroup } from "@/renderer/shared/components/ui/kbd";
import { cn } from "@/renderer/shared/lib/class-names";

interface TodayKeyboardHintProps {
  hint: TodayKeyboardHintValue | null;
}

interface HintItem {
  keys: string[];
  label: string;
}

const CHECKLIST_HINT: HintItem[] = [
  { keys: ["↑", "↓"], label: "move" },
  { keys: ["Space"], label: "complete" },
  { keys: ["N"], label: "next" },
];
const PERIODIC_HINT: HintItem[] = [
  { keys: ["↑", "↓"], label: "move" },
  { keys: ["→"], label: "add" },
  { keys: ["←"], label: "subtract" },
  { keys: ["N"], label: "next" },
];

function getHintItems(hint: TodayKeyboardHintValue): HintItem[] {
  return hint.kind === "periodic" ? PERIODIC_HINT : CHECKLIST_HINT;
}

function TodayKeyboardHintComponent({ hint }: TodayKeyboardHintProps) {
  return (
    <AnimatePresence>
      {hint ? (
        <m.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "pointer-events-none fixed right-5 bottom-5 z-40 hidden items-center gap-2 rounded-md border border-border/70 bg-popover/92 px-2.5 py-1.5 text-[0.68rem] leading-none text-muted-foreground shadow-sm",
            "backdrop-blur-sm md:block"
          )}
          exit={{ opacity: 0, y: 6 }}
          initial={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.14 }}
        >
          <div className="flex items-center gap-2">
            {getHintItems(hint).map((item) => (
              <span
                className="inline-flex items-center gap-1.5"
                key={`${item.keys.join("-")}-${item.label}`}
              >
                <KbdGroup>
                  {item.keys.map((key) => (
                    <Kbd
                      className="h-4 min-w-4 bg-muted/80 px-1 text-[0.62rem]"
                      key={key}
                    >
                      {key}
                    </Kbd>
                  ))}
                </KbdGroup>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

export const TodayKeyboardHint = memo(TodayKeyboardHintComponent);
