import { RotateCcw } from "lucide-react";

import { HABIT_CATEGORY_ICONS } from "@/renderer/shared/lib/habit-categories";
import {
  getDefaultHabitCategoryPreferences,
  getHabitCategoryUi,
} from "@/renderer/shared/lib/habit-category-presentation";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import { Input } from "@/renderer/shared/ui/input";
import { Label } from "@/renderer/shared/ui/label";
import { HABIT_CATEGORY_SLOTS } from "@/shared/domain/habit";

import type { SettingsPageProps } from "../../settings.types";

export function CategorySettingsCard({
  fieldErrors,
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  const defaultCategoryPreferences = getDefaultHabitCategoryPreferences();

  return (
    <Card>
      <CardHeader>
        <CardDescription>Categories</CardDescription>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Customize</CardTitle>
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
          Rename your three category groups and choose their colors. Existing
          habits update automatically.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {HABIT_CATEGORY_SLOTS.map(({ value }) => {
          const Icon = HABIT_CATEGORY_ICONS[value];
          const categoryUi = getHabitCategoryUi(
            value,
            settings.categoryPreferences
          );

          return (
            <div
              key={value}
              className="grid gap-3 rounded-2xl border border-border/60 bg-muted/25 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full border p-2"
                    style={categoryUi.panelStyle}
                  >
                    <Icon
                      className="size-4"
                      style={{ color: categoryUi.color }}
                    />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {categoryUi.label}
                    </p>
                  </div>
                </div>

                <Button
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
                  Reset
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
                <div className="grid gap-2">
                  <Label htmlFor={`category-label-${value}`}>Label</Label>
                  <Input
                    id={`category-label-${value}`}
                    maxLength={24}
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`category-color-${value}`}>Color</Label>
                  <input
                    aria-label={`${categoryUi.label} color`}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-transparent p-1"
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
                </div>

                <div className="grid gap-2">
                  <Label>Preview</Label>
                  <div
                    className="inline-flex h-10 items-center rounded-full border px-3 text-sm font-medium"
                    style={{
                      backgroundColor: categoryUi.color,
                      borderColor: categoryUi.color,
                      color: categoryUi.selectedTextColor,
                    }}
                  >
                    {categoryUi.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {fieldErrors.categoryPreferences ? (
          <p className="text-sm text-destructive">
            {fieldErrors.categoryPreferences}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
