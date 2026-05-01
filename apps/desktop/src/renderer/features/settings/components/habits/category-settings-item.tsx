import { ChevronDown, Palette, RotateCcw } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { Input } from "@/renderer/shared/components/ui/input";
import { cn } from "@/renderer/shared/lib/class-names";
import { HABIT_CATEGORY_ICON_OPTIONS } from "@/renderer/shared/lib/habit-categories";
import { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import type { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";
import type { HabitCategoryPreferences } from "@/shared/domain/settings";

const PRESET_CATEGORY_COLORS = [
  "#FF2D55",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#78C500",
  "#34C759",
  "#04C7DD",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
  "#A2845E",
  "#8E8E93",
] as const;

type CategoryValue = (typeof HABIT_CATEGORY_SLOTS)[number]["value"];

interface CategorySettingsItemProps {
  colorPickerRef: RefObject<HTMLInputElement | null>;
  defaultCategoryPreference: {
    color: string;
    icon: string;
    label: string;
  };
  isColorPanelOpen: boolean;
  isIconPanelOpen: boolean;
  onChange: (
    value: CategoryValue,
    update: { color?: string; icon?: string; label?: string }
  ) => void;
  onTogglePanel: (section: "color" | "icon", value: CategoryValue) => void;
  settings: {
    categoryPreferences: HabitCategoryPreferences;
  };
  value: CategoryValue;
}

export function CategorySettingsItem({
  colorPickerRef,
  defaultCategoryPreference,
  isColorPanelOpen,
  isIconPanelOpen,
  onChange,
  onTogglePanel,
  settings,
  value,
}: CategorySettingsItemProps) {
  const categoryPresentation = getHabitCategoryPresentation(
    value,
    settings.categoryPreferences
  );
  const Icon = categoryPresentation.icon;

  return (
    <div className="rounded-md border border-border/60 bg-muted/25 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-4">
        <button
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-105"
          onClick={() => colorPickerRef.current?.click()}
          style={{
            backgroundColor: `${categoryPresentation.color}20`,
            borderColor: categoryPresentation.color,
            color: categoryPresentation.accentTextColor,
          }}
          title={`Change ${categoryPresentation.label} color`}
          type="button"
        >
          <Icon className="size-5" />
        </button>

        <input
          ref={colorPickerRef}
          aria-label={`${categoryPresentation.label} color`}
          className="sr-only"
          id={`category-color-${value}`}
          onChange={(event) => {
            onChange(value, { color: event.target.value.toUpperCase() });
          }}
          type="color"
          value={settings.categoryPreferences[value].color}
        />

        <div className="flex w-full min-w-0 flex-1 flex-col gap-1.5">
          <Input
            id={`category-label-${value}`}
            maxLength={24}
            className="h-8 border-transparent bg-transparent px-0 text-base font-medium shadow-none outline-none focus-visible:border-border focus-visible:bg-background focus-visible:px-3 focus-visible:ring-0"
            onChange={(event) => {
              onChange(value, { label: event.target.value });
            }}
            type="text"
            value={settings.categoryPreferences[value].label}
          />
          <div className="flex flex-wrap gap-3">
            <button
              aria-expanded={isColorPanelOpen}
              className="flex h-9 items-center gap-2 rounded-md border border-input bg-background/70 px-3 text-sm shadow-sm transition-colors hover:bg-muted"
              onClick={() => {
                onTogglePanel("color", value);
              }}
              type="button"
            >
              <div
                className="size-4 rounded-full border border-foreground/30 shadow-sm"
                style={{
                  backgroundColor: settings.categoryPreferences[value].color,
                }}
              />
              <span>{settings.categoryPreferences[value].color}</span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  isColorPanelOpen ? "rotate-180" : ""
                )}
              />
            </button>
            <button
              aria-expanded={isIconPanelOpen}
              className="flex h-9 items-center gap-2 rounded-md border border-input bg-background/70 px-3 text-sm shadow-sm transition-colors hover:bg-muted"
              onClick={() => {
                onTogglePanel("icon", value);
              }}
              type="button"
            >
              <Icon
                className="size-4"
                style={{ color: categoryPresentation.accentTextColor }}
              />
              <span>
                {HABIT_CATEGORY_ICON_OPTIONS.find(
                  (option) =>
                    option.value === settings.categoryPreferences[value].icon
                )?.label ?? "Select icon"}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  isIconPanelOpen ? "rotate-180" : ""
                )}
              />
            </button>
          </div>
        </div>

        <Button
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            onChange(value, defaultCategoryPreference);
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {isColorPanelOpen ? (
        <div className="mt-4 rounded-md border border-border/60 bg-background/70 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Palette className="size-4" />
            Color
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_CATEGORY_COLORS.map((color) => {
              const isSelected =
                settings.categoryPreferences[value].color === color;

              return (
                <button
                  key={color}
                  aria-label={`Set ${categoryPresentation.label} color to ${color}`}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform hover:scale-110",
                    isSelected
                      ? "scale-110 border-foreground shadow-sm"
                      : "border-transparent"
                  )}
                  onClick={() => {
                    onChange(value, { color });
                  }}
                  style={{ backgroundColor: color }}
                  title={`Set color to ${color}`}
                  type="button"
                />
              );
            })}
            <button
              className="flex size-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
              onClick={() => colorPickerRef.current?.click()}
              title="Custom Color"
              type="button"
            >
              <span className="sr-only">Custom Color</span>
              <span className="pb-0.5 text-sm">+</span>
            </button>
          </div>
        </div>
      ) : null}

      {isIconPanelOpen ? (
        <div className="mt-4 rounded-md border border-border/60 bg-background/70 p-3">
          <div className="mb-3 text-sm font-medium">Icon</div>
          <div className="flex max-h-60 flex-wrap gap-1.5 overflow-y-auto pr-1">
            {HABIT_CATEGORY_ICON_OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              const isSelected =
                settings.categoryPreferences[value].icon === option.value;

              return (
                <button
                  key={option.value}
                  aria-label={`Use ${option.label} icon for ${categoryPresentation.label}`}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md border transition-colors hover:scale-105",
                    isSelected
                      ? "shadow-sm"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                  onClick={() => {
                    onChange(value, { icon: option.value });
                  }}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${categoryPresentation.color}18`,
                          borderColor: categoryPresentation.color,
                          color: categoryPresentation.accentTextColor,
                        }
                      : undefined
                  }
                  title={`Use ${option.label} icon`}
                  type="button"
                >
                  <OptionIcon className="size-5" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
