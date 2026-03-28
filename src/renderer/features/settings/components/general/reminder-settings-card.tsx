/* eslint-disable promise/prefer-await-to-then */

import { Bell, Globe2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
} from "@/renderer/shared/ui/item";
import { Label } from "@/renderer/shared/ui/label";
import { Switch } from "@/renderer/shared/ui/switch";
import { TimeInput } from "@/renderer/shared/ui/time-input";
import type { DesktopNotificationStatus } from "@/shared/contracts/habits-ipc";
import { DEFAULT_REMINDER_SNOOZE_MINUTES } from "@/shared/domain/settings";

interface NotificationStatusMessage {
  className: string;
  text: string;
}

function getNotificationStatusMessage(
  status: DesktopNotificationStatus
): NotificationStatusMessage | null {
  if (status.availability === "available") {
    return null;
  }

  if (status.availability === "blocked") {
    switch (status.reason) {
      case "app-busy": {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently blocked because Windows marked this session as busy.",
        };
      }
      case "do-not-disturb": {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently silenced by Do Not Disturb.",
        };
      }
      case "full-screen-app": {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently blocked while a full-screen app is active.",
        };
      }
      case "other-app-active": {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently blocked by another active app.",
        };
      }
      case "presentation-mode": {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently blocked while presentation mode is active.",
        };
      }
      case "quiet-time": {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently blocked by Windows quiet time.",
        };
      }
      case "session-locked": {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently blocked because your session is locked.",
        };
      }
      default: {
        return {
          className: "border-destructive/25 bg-destructive/8 text-destructive",
          text: "Desktop notifications are currently blocked by your system or current session.",
        };
      }
    }
  }

  if (status.availability === "unsupported") {
    return {
      className: "border-border/60 bg-muted/25 text-muted-foreground",
      text: "Zucchini cannot verify desktop notification delivery on this platform.",
    };
  }

  return {
    className: "border-border/60 bg-muted/25 text-muted-foreground",
    text: "Zucchini cannot verify desktop notification delivery right now. Reminders may still be blocked in your system settings.",
  };
}

export function ReminderSettingsCard({
  fieldErrors,
  onChange,
  settings,
}: Pick<SettingsPageProps, "fieldErrors" | "onChange" | "settings">) {
  const [notificationStatus, setNotificationStatus] =
    useState<DesktopNotificationStatus | null>(null);
  const timezoneOptions = useMemo(() => {
    const supportedTimezones =
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

    return [...new Set([settings.timezone, ...supportedTimezones])];
  }, [settings.timezone]);

  useEffect(() => {
    let isMounted = true;

    const refreshNotificationStatus = async () => {
      try {
        const nextStatus = await window.habits.getDesktopNotificationStatus();
        if (isMounted) {
          setNotificationStatus(nextStatus);
        }
      } catch {
        if (isMounted) {
          setNotificationStatus({
            availability: "unknown",
            reason: "platform-error",
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshNotificationStatus().catch(() => {
          // `refreshNotificationStatus` already updates the fallback state.
        });
      }
    };

    refreshNotificationStatus().catch(() => {
      // `refreshNotificationStatus` already updates the fallback state.
    });
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const notificationStatusMessage =
    settings.reminderEnabled && notificationStatus
      ? getNotificationStatusMessage(notificationStatus)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Settings</CardDescription>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <CardTitle>Reminders</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ItemGroup className="gap-0">
          <Item className="py-2">
            <ItemContent>
              <Label htmlFor="reminder-enabled" className="text-sm font-medium">
                Enable reminder
              </Label>
              <ItemDescription className="text-xs leading-snug">
                Receive daily notifications for incomplete habits.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.reminderEnabled}
                  id="reminder-enabled"
                  onCheckedChange={(checked) =>
                    onChange({ ...settings, reminderEnabled: checked })
                  }
                />
              </div>
            </ItemActions>
          </Item>

          {notificationStatusMessage ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${notificationStatusMessage.className}`}
            >
              {notificationStatusMessage.text}
            </div>
          ) : null}

          <Item className="py-2">
            <ItemContent>
              <Label htmlFor="reminder-time" className="text-sm font-medium">
                Time
              </Label>
              <ItemDescription className="text-xs leading-snug">
                When should we remind you?
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <TimeInput
                aria-invalid={fieldErrors.reminderTime ? true : undefined}
                id="reminder-time"
                onChange={(val) => onChange({ ...settings, reminderTime: val })}
                value={settings.reminderTime}
              />
            </ItemActions>
          </Item>

          {fieldErrors.reminderTime ? (
            <p className="px-0 text-xs text-destructive">
              {fieldErrors.reminderTime}
            </p>
          ) : null}

          <Item className="py-2">
            <ItemContent>
              <Label
                htmlFor="reminder-timezone"
                className="text-sm font-medium"
              >
                Timezone
              </Label>
              <ItemDescription className="text-xs leading-snug">
                Choose the timezone used for reminder timing.
              </ItemDescription>
            </ItemContent>
            <ItemActions className="max-w-[220px]">
              <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm ring-offset-background transition-colors focus-within:outline-none focus-within:ring-1 focus-within:ring-ring">
                <Globe2 className="size-3.5 shrink-0 text-muted-foreground" />
                <select
                  aria-label="Timezone"
                  aria-invalid={fieldErrors.timezone ? true : undefined}
                  id="reminder-timezone"
                  className="w-full cursor-pointer appearance-none bg-transparent text-sm text-foreground outline-none"
                  onChange={(event) =>
                    onChange({ ...settings, timezone: event.target.value })
                  }
                  value={settings.timezone}
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </ItemActions>
          </Item>

          {fieldErrors.timezone ? (
            <p className="px-0 text-xs text-destructive">
              {fieldErrors.timezone}
            </p>
          ) : null}
        </ItemGroup>

        <ItemSeparator />

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="mb-4 space-y-1">
            <p className="text-sm font-medium">Background reminders</p>
            <p className="text-sm text-muted-foreground">
              Only turn these on if you want reminders to keep working after you
              close the window.
            </p>
          </div>

          <ItemGroup className="gap-3">
            <Item className="px-0 py-0">
              <ItemContent>
                <Label
                  htmlFor="launch-at-login"
                  className="text-sm font-medium"
                >
                  Launch at login
                </Label>
                <ItemDescription>
                  Start Zucchini automatically when you sign in.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  checked={settings.launchAtLogin}
                  id="launch-at-login"
                  onCheckedChange={(checked) =>
                    onChange({ ...settings, launchAtLogin: checked })
                  }
                />
              </ItemActions>
            </Item>

            <Item className="px-0 py-0">
              <ItemContent>
                <Label
                  htmlFor="minimize-to-tray"
                  className="text-sm font-medium"
                >
                  Keep running in tray
                </Label>
                <ItemDescription>
                  Closing the window keeps Zucchini alive for reminders.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  checked={settings.minimizeToTray}
                  id="minimize-to-tray"
                  onCheckedChange={(checked) =>
                    onChange({ ...settings, minimizeToTray: checked })
                  }
                />
              </ItemActions>
            </Item>

            <Item className="px-0 py-0">
              <ItemContent>
                <Label
                  htmlFor="reminder-snooze"
                  className="text-sm font-medium"
                >
                  Snooze length
                </Label>
                <ItemDescription>
                  How long tray snooze waits before reminding again.
                </ItemDescription>
              </ItemContent>
              <ItemActions className="max-w-[140px]">
                <input
                  aria-invalid={
                    fieldErrors.reminderSnoozeMinutes ? true : undefined
                  }
                  id="reminder-snooze"
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  min={1}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    onChange({
                      ...settings,
                      reminderSnoozeMinutes: Number.isFinite(value)
                        ? value
                        : DEFAULT_REMINDER_SNOOZE_MINUTES,
                    });
                  }}
                  type="number"
                  value={settings.reminderSnoozeMinutes}
                />
              </ItemActions>
            </Item>

            {fieldErrors.reminderSnoozeMinutes ? (
              <p className="text-xs text-destructive">
                {fieldErrors.reminderSnoozeMinutes}
              </p>
            ) : null}
          </ItemGroup>
        </div>
      </CardContent>
    </Card>
  );
}
