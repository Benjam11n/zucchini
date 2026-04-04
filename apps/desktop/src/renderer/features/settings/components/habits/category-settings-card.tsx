import { RotateCcw, Tags } from "lucide-react";
import { useState, useRef } from "react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  getDefaultHabitCategoryPreferences,
  getHabitCategoryPresentation,
} from "@/renderer/shared/lib/habit-category-presentation";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";

import { CategorySettingsItem } from "./category-settings-item";

const CATEGORY_PREVIEW_RING_ORDER = [
  "fitness",
  "nutrition",
  "productivity",
] as const;

export function CategorySettingsCard({
  fieldErrors,
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  const defaultCategoryPreferences = getDefaultHabitCategoryPreferences();
  const [openPanel, setOpenPanel] = useState<null | {
    section: "color" | "icon";
    value: (typeof HABIT_CATEGORY_SLOTS)[number]["value"];
  }>(null);

  // Create refs for hidden color inputs to trigger them via SVG rings
  const colorPickerRefs = {
    [HABIT_CATEGORY_SLOTS[0]?.value ?? "slot-1"]:
      useRef<HTMLInputElement>(null),
    [HABIT_CATEGORY_SLOTS[1]?.value ?? "slot-2"]:
      useRef<HTMLInputElement>(null),
    [HABIT_CATEGORY_SLOTS[2]?.value ?? "slot-3"]:
      useRef<HTMLInputElement>(null),
  };

  return (
    <Card>
      <SettingsCardHeader
        action={
          <Button
            onClick={() => {
              onChange({
                ...settings,
                categoryPreferences: defaultCategoryPreferences,
              });
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            <RotateCcw className="size-4" />
            Reset to defaults
          </Button>
        }
        description="Rename categories and update their icons and colors."
        icon={Tags}
        title="Categories"
      />
      <CardContent>
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-center">
          {/* INTERACTIVE 3-RING DISPLAY */}
          <div className="relative flex size-56 shrink-0 items-center justify-center">
            <svg
              className="absolute inset-0 size-full -rotate-90 drop-shadow-sm"
              fill="transparent"
              viewBox="0 0 200 200"
            >
              {CATEGORY_PREVIEW_RING_ORDER.map((value, index) => {
                const categoryPresentation = getHabitCategoryPresentation(
                  value,
                  settings.categoryPreferences
                );
                // Radii for out, middle, inner: 80, 56, 32
                const r = 80 - index * 24;
                const circumference = 2 * Math.PI * r;

                return (
                  <g
                    key={`ring-${value}`}
                    className="group cursor-pointer transition-opacity hover:opacity-80 active:opacity-100"
                    onClick={() => {
                      // Trigger the hidden color input when a ring is clicked
                      colorPickerRefs[value]?.current?.click();
                    }}
                  >
                    {/* Ring background track */}
                    <circle
                      cx="100"
                      cy="100"
                      r={r}
                      stroke="currentColor"
                      strokeWidth="16"
                      className="text-muted/20 transition-colors group-hover:text-muted/30"
                    />
                    {/* 75% visual fill */}
                    <circle
                      className="transition-colors"
                      cx="100"
                      cy="100"
                      r={r}
                      stroke={categoryPresentation.color}
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * 0.25}
                      strokeLinecap="round"
                      strokeWidth="16"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* EDITABLE LABELS AND CONTROLS */}
          <div className="flex w-full flex-1 flex-col gap-4">
            {HABIT_CATEGORY_SLOTS.map(({ value }) => {
              const isColorPanelOpen =
                openPanel?.section === "color" && openPanel.value === value;
              const isIconPanelOpen =
                openPanel?.section === "icon" && openPanel.value === value;

              return (
                <CategorySettingsItem
                  key={value}
                  colorPickerRef={colorPickerRefs[value]}
                  defaultCategoryPreference={defaultCategoryPreferences[value]}
                  isColorPanelOpen={isColorPanelOpen}
                  isIconPanelOpen={isIconPanelOpen}
                  onChange={(nextValue, update) => {
                    onChange({
                      ...settings,
                      categoryPreferences: {
                        ...settings.categoryPreferences,
                        [nextValue]: {
                          ...settings.categoryPreferences[nextValue],
                          ...update,
                        },
                      },
                    });
                  }}
                  onTogglePanel={(section, nextValue) => {
                    setOpenPanel((current) =>
                      current?.section === section &&
                      current.value === nextValue
                        ? null
                        : { section, value: nextValue }
                    );
                  }}
                  settings={settings}
                  value={value}
                />
              );
            })}
          </div>
        </div>

        {fieldErrors.categoryPreferences ? (
          <p className="mt-4 text-sm text-destructive">
            {fieldErrors.categoryPreferences}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
