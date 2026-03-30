import { useEffect, useState } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { DurationInput } from "@/renderer/shared/components/ui/duration-input";
import { Input } from "@/renderer/shared/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/components/ui/item";
import { Label } from "@/renderer/shared/components/ui/label";
import { FOCUS_TIMER_SHORTCUT_REFERENCE } from "@/shared/contracts/keyboard-shortcuts";
import { createDefaultFocusTimerShortcutSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

function sanitizeIntegerInput(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, 2);
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
  const [cyclesInput, setCyclesInput] = useState(() =>
    settings.focusCyclesBeforeLongBreak.toString()
  );
  const defaultShortcutSettings = createDefaultFocusTimerShortcutSettings();

  useEffect(() => {
    setCyclesInput(settings.focusCyclesBeforeLongBreak.toString());
  }, [settings.focusCyclesBeforeLongBreak]);

  const commitCycles = () => {
    const parsedValue = Number.parseInt(cyclesInput, 10);

    if (!Number.isInteger(parsedValue)) {
      setCyclesInput(settings.focusCyclesBeforeLongBreak.toString());
      return;
    }

    const normalizedValue = Math.min(12, Math.max(1, parsedValue));
    setCyclesInput(normalizedValue.toString());

    if (normalizedValue !== settings.focusCyclesBeforeLongBreak) {
      onChange({
        ...settings,
        focusCyclesBeforeLongBreak: normalizedValue,
      });
    }
  };

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
          <DurationInput
            className="gap-2"
            inputClassName="h-8 w-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            minuteAriaLabel="Default focus minutes"
            minuteInputId={`${idPrefix}-focus-minutes`}
            onCommit={(focusDefaultDurationSeconds) => {
              onChange({
                ...settings,
                focusDefaultDurationSeconds,
              });
            }}
            secondAriaLabel="Default focus seconds"
            valueSeconds={settings.focusDefaultDurationSeconds}
          />
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
            htmlFor={`${idPrefix}-short-break-minutes`}
            className="text-sm font-medium"
          >
            Short break
          </Label>
          <ItemDescription>
            Duration for the standard break between focus sessions.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="max-w-[180px]">
          <DurationInput
            inputClassName="h-8 w-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            minuteAriaLabel="Short break minutes"
            minuteInputId={`${idPrefix}-short-break-minutes`}
            onCommit={(focusShortBreakSeconds) => {
              onChange({
                ...settings,
                focusShortBreakSeconds,
              });
            }}
            secondAriaLabel="Short break seconds"
            secondInputId={`${idPrefix}-short-break-seconds`}
            valueSeconds={settings.focusShortBreakSeconds}
          />
        </ItemActions>
      </Item>

      {fieldErrors.focusShortBreakSeconds ? (
        <p className="text-xs text-destructive">
          {fieldErrors.focusShortBreakSeconds}
        </p>
      ) : null}

      <Item className="px-0 py-0">
        <ItemContent>
          <Label
            htmlFor={`${idPrefix}-long-break-minutes`}
            className="text-sm font-medium"
          >
            Long break
          </Label>
          <ItemDescription>
            Duration for the recovery break after a full pomodoro set.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="max-w-[180px]">
          <DurationInput
            inputClassName="h-8 w-16 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            minuteAriaLabel="Long break minutes"
            minuteInputId={`${idPrefix}-long-break-minutes`}
            onCommit={(focusLongBreakSeconds) => {
              onChange({
                ...settings,
                focusLongBreakSeconds,
              });
            }}
            secondAriaLabel="Long break seconds"
            secondInputId={`${idPrefix}-long-break-seconds`}
            valueSeconds={settings.focusLongBreakSeconds}
          />
        </ItemActions>
      </Item>

      {fieldErrors.focusLongBreakSeconds ? (
        <p className="text-xs text-destructive">
          {fieldErrors.focusLongBreakSeconds}
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
            inputMode="numeric"
            onBlur={commitCycles}
            onChange={(event) => {
              setCyclesInput(sanitizeIntegerInput(event.currentTarget.value));
            }}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitCycles();
                event.currentTarget.blur();
              }
            }}
            value={cyclesInput}
          />
        </ItemActions>
      </Item>

      {fieldErrors.focusCyclesBeforeLongBreak ? (
        <p className="text-xs text-destructive">
          {fieldErrors.focusCyclesBeforeLongBreak}
        </p>
      ) : null}

      <Item className="px-0 py-0">
        <ItemContent>
          <Label
            htmlFor={`${idPrefix}-toggle-shortcut`}
            className="text-sm font-medium"
          >
            Global start/pause/resume shortcut
          </Label>
          <ItemDescription>
            Uses standard system modifiers only. Globe/Fn is not supported.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="w-full max-w-[260px]">
          <Input
            aria-invalid={
              fieldErrors.toggleFocusTimerShortcut ? true : undefined
            }
            id={`${idPrefix}-toggle-shortcut`}
            onChange={(event) => {
              onChange({
                ...settings,
                toggleFocusTimerShortcut: event.currentTarget.value,
              });
            }}
            value={settings.toggleFocusTimerShortcut}
          />
          <Button
            onClick={() => {
              onChange({
                ...settings,
                toggleFocusTimerShortcut:
                  defaultShortcutSettings.toggleFocusTimerShortcut,
              });
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            Reset
          </Button>
        </ItemActions>
      </Item>

      {fieldErrors.toggleFocusTimerShortcut ? (
        <p className="text-xs text-destructive">
          {fieldErrors.toggleFocusTimerShortcut}
        </p>
      ) : null}

      <Item className="px-0 py-0">
        <ItemContent>
          <Label
            htmlFor={`${idPrefix}-reset-shortcut`}
            className="text-sm font-medium"
          >
            Global reset shortcut
          </Label>
          <ItemDescription>
            {`Enter an accelerator like ${FOCUS_TIMER_SHORTCUT_REFERENCE.reset}.`}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="w-full max-w-[260px]">
          <Input
            aria-invalid={
              fieldErrors.resetFocusTimerShortcut ? true : undefined
            }
            id={`${idPrefix}-reset-shortcut`}
            onChange={(event) => {
              onChange({
                ...settings,
                resetFocusTimerShortcut: event.currentTarget.value,
              });
            }}
            value={settings.resetFocusTimerShortcut}
          />
          <Button
            onClick={() => {
              onChange({
                ...settings,
                resetFocusTimerShortcut:
                  defaultShortcutSettings.resetFocusTimerShortcut,
              });
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            Reset
          </Button>
        </ItemActions>
      </Item>

      {fieldErrors.resetFocusTimerShortcut ? (
        <p className="text-xs text-destructive">
          {fieldErrors.resetFocusTimerShortcut}
        </p>
      ) : null}
    </ItemGroup>
  );
}
