import { Bell, Globe2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TimeInput } from "@/components/ui/time-input";

import type { OnboardingReminderDraft, ReminderFieldErrors } from "./types";

interface OnboardingReminderStepProps {
  fieldErrors: ReminderFieldErrors;
  reminderDraft: OnboardingReminderDraft;
  onChange: (draft: OnboardingReminderDraft) => void;
}

export function OnboardingReminderStep({
  fieldErrors,
  reminderDraft,
  onChange,
}: OnboardingReminderStepProps) {
  const timezoneOptions =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [
          "UTC",
          "Asia/Singapore",
          "Asia/Tokyo",
          "Australia/Sydney",
          "Europe/London",
          "Europe/Paris",
          "America/New_York",
          "America/Chicago",
          "America/Denver",
          "America/Los_Angeles",
        ];

  return (
    <Card className="border border-border/70 bg-card/95">
      <CardHeader>
        <CardDescription>Step 3</CardDescription>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <CardTitle>Reminder setup</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-4">
          <div className="grid gap-1">
            <Label htmlFor="onboarding-reminder-enabled">
              Enable reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              We will only ask the OS for notification permission when you
              finish onboarding.
            </p>
          </div>
          <Switch
            checked={reminderDraft.reminderEnabled}
            id="onboarding-reminder-enabled"
            onCheckedChange={(checked) =>
              onChange({
                ...reminderDraft,
                reminderEnabled: checked,
              })
            }
          />
        </div>

        <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-4">
          <Label htmlFor="onboarding-reminder-time">Reminder time</Label>
          <TimeInput
            aria-invalid={fieldErrors.reminderTime ? true : undefined}
            id="onboarding-reminder-time"
            onChange={(value) =>
              onChange({
                ...reminderDraft,
                reminderTime: value,
              })
            }
            value={reminderDraft.reminderTime}
          />
          {fieldErrors.reminderTime ? (
            <p className="text-xs text-destructive">
              {fieldErrors.reminderTime}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 rounded-xl border border-border/60 bg-background/70 p-4">
          <Label htmlFor="onboarding-timezone">Timezone</Label>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring">
            <Globe2 className="size-4 shrink-0 text-muted-foreground" />
            <select
              aria-invalid={fieldErrors.timezone ? true : undefined}
              id="onboarding-timezone"
              className="w-full cursor-pointer appearance-none bg-transparent outline-none"
              onChange={(event) =>
                onChange({
                  ...reminderDraft,
                  timezone: event.target.value,
                })
              }
              value={reminderDraft.timezone}
            >
              {[...new Set([reminderDraft.timezone, ...timezoneOptions])].map(
                (timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone.replaceAll("_", " ")}
                  </option>
                )
              )}
            </select>
          </div>
          {fieldErrors.timezone ? (
            <p className="text-xs text-destructive">{fieldErrors.timezone}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
