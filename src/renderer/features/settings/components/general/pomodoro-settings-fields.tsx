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
import type { AppSettings } from "@/shared/domain/settings";

function parseNumberInput(value: string, fallback: number): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function padTimerPart(value: number): string {
  return value.toString().padStart(2, "0");
}

function sanitizeTimerInput(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, 2);
}

function getFocusDurationParts(durationSeconds: number) {
  const safeDurationSeconds = Math.max(1, Math.min(60 * 60, durationSeconds));

  return {
    minutes: Math.floor(safeDurationSeconds / 60),
    seconds: safeDurationSeconds % 60,
  };
}

function toFocusDurationSeconds(minutes: number, seconds: number): number {
  const normalizedMinutes = Math.min(60, Math.max(0, minutes));
  const normalizedSeconds =
    normalizedMinutes === 60 ? 0 : Math.min(59, Math.max(0, seconds));

  return Math.max(
    1,
    Math.min(60 * 60, normalizedMinutes * 60 + normalizedSeconds)
  );
}

export function PomodoroSettingsFields({
  fieldErrors,
  idPrefix,
  onChange,
  settings,
}: {
  fieldErrors: Partial<Record<keyof AppSettings, string>>;
  idPrefix: string;
  onChange: (settings: AppSettings) => void;
  settings: AppSettings;
}) {
  const durationParts = getFocusDurationParts(
    settings.focusDefaultDurationSeconds
  );

  return (
    <ItemGroup className="gap-3">
      <Item className="px-0 py-0">
        <ItemContent>
          <Label
            htmlFor={`${idPrefix}-focus-minutes`}
            className="text-sm font-medium"
          >
            Focus duration
          </Label>
          <ItemDescription>
            Default duration for each focus session in the set.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="max-w-[180px] gap-2">
          <div className="flex items-center gap-2">
            <input
              aria-invalid={
                fieldErrors.focusDefaultDurationSeconds ? true : undefined
              }
              aria-label="Default focus minutes"
              id={`${idPrefix}-focus-minutes`}
              className="h-8 w-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              inputMode="numeric"
              onChange={(event) => {
                const nextMinutes = parseNumberInput(
                  sanitizeTimerInput(event.target.value),
                  durationParts.minutes
                );
                onChange({
                  ...settings,
                  focusDefaultDurationSeconds: toFocusDurationSeconds(
                    nextMinutes,
                    durationParts.seconds
                  ),
                });
              }}
              value={padTimerPart(durationParts.minutes)}
            />
            <span className="text-sm text-muted-foreground">:</span>
            <input
              aria-invalid={
                fieldErrors.focusDefaultDurationSeconds ? true : undefined
              }
              aria-label="Default focus seconds"
              className="h-8 w-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              inputMode="numeric"
              onChange={(event) => {
                const nextSeconds = parseNumberInput(
                  sanitizeTimerInput(event.target.value),
                  durationParts.seconds
                );
                onChange({
                  ...settings,
                  focusDefaultDurationSeconds: toFocusDurationSeconds(
                    durationParts.minutes,
                    nextSeconds
                  ),
                });
              }}
              value={padTimerPart(durationParts.seconds)}
            />
          </div>
        </ItemActions>
      </Item>

      {fieldErrors.focusDefaultDurationSeconds ? (
        <p className="text-xs text-destructive">
          {fieldErrors.focusDefaultDurationSeconds}
        </p>
      ) : null}

      <Item className="px-0 py-0">
        <ItemContent>
          <Label
            htmlFor={`${idPrefix}-short-break`}
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
            aria-invalid={fieldErrors.focusShortBreakMinutes ? true : undefined}
            id={`${idPrefix}-short-break`}
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
          <Label
            htmlFor={`${idPrefix}-long-break`}
            className="text-sm font-medium"
          >
            Long break
          </Label>
          <ItemDescription>
            Minutes for the recovery break after a full pomodoro set.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="max-w-[140px]">
          <input
            aria-invalid={fieldErrors.focusLongBreakMinutes ? true : undefined}
            id={`${idPrefix}-long-break`}
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
          <Label htmlFor={`${idPrefix}-cycles`} className="text-sm font-medium">
            Long break after
          </Label>
          <ItemDescription>
            Completed focus sessions before switching to a long break.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="max-w-[140px]">
          <input
            aria-invalid={
              fieldErrors.focusCyclesBeforeLongBreak ? true : undefined
            }
            id={`${idPrefix}-cycles`}
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
  );
}
