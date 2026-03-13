import { TimerReset } from "lucide-react";

import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/ui/item";
import { Label } from "@/renderer/shared/ui/label";
import {
  DEFAULT_FOCUS_CYCLES_BEFORE_LONG_BREAK,
  DEFAULT_FOCUS_LONG_BREAK_MINUTES,
  DEFAULT_FOCUS_SHORT_BREAK_MINUTES,
} from "@/shared/domain/settings";

function parseNumberInput(value: string, fallback: number): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function PomodoroSettingsCard({
  fieldErrors,
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TimerReset className="size-4 text-primary" />
          <CardTitle>Pomodoro</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-3">
          <Item className="px-0 py-0">
            <ItemContent>
              <Label
                htmlFor="focus-short-break"
                className="text-sm font-medium"
              >
                Short break
              </Label>
              <ItemDescription>
                Minutes for the standard break between focus sessions.
              </ItemDescription>
            </ItemContent>
            <ItemActions className="max-w-[140px]">
              <input
                aria-invalid={
                  fieldErrors.focusShortBreakMinutes ? true : undefined
                }
                id="focus-short-break"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                min={1}
                onChange={(event) => {
                  onChange({
                    ...settings,
                    focusShortBreakMinutes: parseNumberInput(
                      event.target.value,
                      DEFAULT_FOCUS_SHORT_BREAK_MINUTES
                    ),
                  });
                }}
                type="number"
                value={settings.focusShortBreakMinutes}
              />
            </ItemActions>
          </Item>

          {fieldErrors.focusShortBreakMinutes ? (
            <p className="text-xs text-destructive">
              {fieldErrors.focusShortBreakMinutes}
            </p>
          ) : null}

          <Item className="px-0 py-0">
            <ItemContent>
              <Label htmlFor="focus-long-break" className="text-sm font-medium">
                Long break
              </Label>
              <ItemDescription>
                Minutes for the recovery break after a full pomodoro set.
              </ItemDescription>
            </ItemContent>
            <ItemActions className="max-w-[140px]">
              <input
                aria-invalid={
                  fieldErrors.focusLongBreakMinutes ? true : undefined
                }
                id="focus-long-break"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                min={1}
                onChange={(event) => {
                  onChange({
                    ...settings,
                    focusLongBreakMinutes: parseNumberInput(
                      event.target.value,
                      DEFAULT_FOCUS_LONG_BREAK_MINUTES
                    ),
                  });
                }}
                type="number"
                value={settings.focusLongBreakMinutes}
              />
            </ItemActions>
          </Item>

          {fieldErrors.focusLongBreakMinutes ? (
            <p className="text-xs text-destructive">
              {fieldErrors.focusLongBreakMinutes}
            </p>
          ) : null}

          <Item className="px-0 py-0">
            <ItemContent>
              <Label
                htmlFor="focus-cycles-before-long-break"
                className="text-sm font-medium"
              >
                Long break after
              </Label>
              <ItemDescription>
                Completed focus cycles before switching to a long break.
              </ItemDescription>
            </ItemContent>
            <ItemActions className="max-w-[140px]">
              <input
                aria-invalid={
                  fieldErrors.focusCyclesBeforeLongBreak ? true : undefined
                }
                id="focus-cycles-before-long-break"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                min={1}
                onChange={(event) => {
                  onChange({
                    ...settings,
                    focusCyclesBeforeLongBreak: parseNumberInput(
                      event.target.value,
                      DEFAULT_FOCUS_CYCLES_BEFORE_LONG_BREAK
                    ),
                  });
                }}
                type="number"
                value={settings.focusCyclesBeforeLongBreak}
              />
            </ItemActions>
          </Item>

          {fieldErrors.focusCyclesBeforeLongBreak ? (
            <p className="text-xs text-destructive">
              {fieldErrors.focusCyclesBeforeLongBreak}
            </p>
          ) : null}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
