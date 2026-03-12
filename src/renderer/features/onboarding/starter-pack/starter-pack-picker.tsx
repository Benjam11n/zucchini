import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import { cn } from "@/renderer/shared/lib/utils";
import { Card, CardContent } from "@/renderer/shared/ui/card";

import type { StarterPackPickerProps } from "../types";
import { getStarterPackSummaryOptions } from "../utils";

export function StarterPackPicker({
  selectedChoice,
  onSelectChoice,
  showBlankOption = false,
}: StarterPackPickerProps) {
  const options = getStarterPackSummaryOptions(showBlankOption);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {options.map((option) => {
        const isSelected = option.id === selectedChoice;

        return (
          <motion.button
            key={option.id}
            type="button"
            className="text-left"
            onClick={() => onSelectChoice(option.id)}
            transition={microTransition}
            whileHover={hoverLift}
            whileTap={tapPress}
          >
            <Card
              className={cn(
                "h-full border border-border/70 bg-card/90 py-0 transition-colors",
                isSelected &&
                  "border-primary bg-primary/8 ring-2 ring-primary/20"
              )}
            >
              <CardContent className="grid h-full gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <p className="text-lg font-black tracking-tight text-foreground">
                      {option.label}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground",
                      isSelected &&
                        "border-primary bg-primary text-primary-foreground"
                    )}
                  >
                    {isSelected ? (
                      <Check className="size-4" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-muted-foreground">
                  <span>{option.habitCount} habits</span>
                  <span className="opacity-40">•</span>
                  <span>
                    {option.id === "blank" ? "manual setup" : "starter pack"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}
