import { Palette } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { THEME_OPTIONS } from "@/renderer/features/settings/constants";

import type { SettingsPageProps } from "./types";

export function AppearanceSettingsCard({
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <CardTitle>Appearance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex gap-3">
          {THEME_OPTIONS.map((option) => {
            const isActive = settings.themeMode === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                id={`theme-mode-${option.value}`}
                type="button"
                onClick={() =>
                  onChange({ ...settings, themeMode: option.value })
                }
                className={cn(
                  "flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-3 text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  isActive
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="size-5 opacity-70" />
                {option.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
