import { RotateCcw, Tags } from "lucide-react";
import { useRef } from "react";

import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import { cn } from "@/renderer/shared/lib/class-names";
import { HABIT_CATEGORY_ICON_OPTIONS } from "@/renderer/shared/lib/habit-categories";
import {
  getDefaultHabitCategoryPreferences,
  getHabitCategoryPresentation,
} from "@/renderer/shared/lib/habit-category-presentation";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/renderer/shared/ui/card";
import { Input } from "@/renderer/shared/ui/input";
import { Label } from "@/renderer/shared/ui/label";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";

export function CategorySettingsCard({
  fieldErrors,
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  const defaultCategoryPreferences = getDefaultHabitCategoryPreferences();

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
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Tags className="size-4" />
          Categories
        </CardDescription>
        <div className="flex items-center justify-end gap-3">
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
        </div>
        <p className="text-sm text-muted-foreground">
          Click the activity rings to change your category colors, rename them,
          and choose an icon below. Existing habits update automatically.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-center">
          {/* INTERACTIVE 3-RING DISPLAY */}
          <div className="relative flex size-56 shrink-0 items-center justify-center">
            <svg
              className="absolute inset-0 size-full -rotate-90 drop-shadow-sm"
              fill="transparent"
              viewBox="0 0 200 200"
            >
              {HABIT_CATEGORY_SLOTS.map(({ value }, index) => {
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
              const categoryPresentation = getHabitCategoryPresentation(
                value,
                settings.categoryPreferences
              );
              const Icon = categoryPresentation.icon;

              return (
                <div
                  key={value}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/25 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <button
                    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-105"
                    onClick={() => colorPickerRefs[value]?.current?.click()}
                    style={{
                      backgroundColor: `${categoryPresentation.color}20`,
                      borderColor: categoryPresentation.color,
                      color: categoryPresentation.color,
                    }}
                    title={`Change ${categoryPresentation.label} color`}
                    type="button"
                  >
                    <Icon className="size-5" />
                  </button>

                  {/* Hidden Color Picker Input */}
                  <input
                    ref={colorPickerRefs[value]}
                    aria-label={`${categoryPresentation.label} color`}
                    className="sr-only"
                    id={`category-color-${value}`}
                    onChange={(event) => {
                      onChange({
                        ...settings,
                        categoryPreferences: {
                          ...settings.categoryPreferences,
                          [value]: {
                            ...settings.categoryPreferences[value],
                            color: event.target.value.toUpperCase(),
                          },
                        },
                      });
                    }}
                    type="color"
                    value={settings.categoryPreferences[value].color}
                  />

                  <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
                    <Label
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      htmlFor={`category-label-${value}`}
                    >
                      {value}
                    </Label>
                    <Input
                      id={`category-label-${value}`}
                      maxLength={24}
                      className="h-8 border-transparent bg-transparent px-0 text-base font-medium shadow-none outline-none focus-visible:border-border focus-visible:bg-background focus-visible:px-3 focus-visible:ring-0"
                      onChange={(event) => {
                        onChange({
                          ...settings,
                          categoryPreferences: {
                            ...settings.categoryPreferences,
                            [value]: {
                              ...settings.categoryPreferences[value],
                              label: event.target.value,
                            },
                          },
                        });
                      }}
                      type="text"
                      value={settings.categoryPreferences[value].label}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {HABIT_CATEGORY_ICON_OPTIONS.map((option) => {
                        const OptionIcon = option.icon;
                        const isSelected =
                          settings.categoryPreferences[value].icon ===
                          option.value;

                        return (
                          <button
                            key={option.value}
                            aria-label={`Use ${option.label} icon for ${categoryPresentation.label}`}
                            className={cn(
                              "flex size-8 items-center justify-center rounded-lg border transition-colors",
                              isSelected
                                ? "shadow-sm"
                                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                            )}
                            onClick={() => {
                              onChange({
                                ...settings,
                                categoryPreferences: {
                                  ...settings.categoryPreferences,
                                  [value]: {
                                    ...settings.categoryPreferences[value],
                                    icon: option.value,
                                  },
                                },
                              });
                            }}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: `${categoryPresentation.color}18`,
                                    borderColor: categoryPresentation.color,
                                    color: categoryPresentation.color,
                                  }
                                : undefined
                            }
                            title={`Use ${option.label} icon`}
                            type="button"
                          >
                            <OptionIcon className="size-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      onChange({
                        ...settings,
                        categoryPreferences: {
                          ...settings.categoryPreferences,
                          [value]: defaultCategoryPreferences[value],
                        },
                      });
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </div>
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
