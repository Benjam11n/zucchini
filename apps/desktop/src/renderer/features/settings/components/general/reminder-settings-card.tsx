import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
} from "@/renderer/shared/components/ui/item";
import { Label } from "@/renderer/shared/components/ui/label";
import { Switch } from "@/renderer/shared/components/ui/switch";
import { TimeInput } from "@/renderer/shared/components/ui/time-input";
import type { DesktopNotificationStatus } from "@/shared/contracts/habits-api";
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
        void refreshNotificationStatus();
      }
    };

    void refreshNotificationStatus();
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
      <SettingsCardHeader
        description="Configure daily reminders."
        icon={Bell}
        title="Reminders"
      />
      <CardContent className="space-y-3">
        <ItemGroup className="gap-0">
          <Item className="py-2">
            <ItemContent>
              <Label htmlFor="reminder-enabled" className="text-sm font-medium">
                Enable reminder
              </Label>
              <ItemDescription>
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
              className={`rounded-md border px-4 py-3 text-sm ${notificationStatusMessage.className}`}
            >
              {notificationStatusMessage.text}
            </div>
          ) : null}

          <Item className="py-2">
            <ItemContent>
              <Label htmlFor="reminder-time" className="text-sm font-medium">
                Time
              </Label>
              <ItemDescription>When should we remind you?</ItemDescription>
            </ItemContent>
            <ItemActions>
              <TimeInput
                id="reminder-time"
                onChange={(val) => onChange({ ...settings, reminderTime: val })}
                value={settings.reminderTime}
                {...(fieldErrors.reminderTime ? { "aria-invalid": true } : {})}
              />
            </ItemActions>
          </Item>

          {fieldErrors.reminderTime ? (
            <p className="px-0 text-xs text-destructive">
              {fieldErrors.reminderTime}
            </p>
          ) : null}
        </ItemGroup>

        <ItemSeparator />

        <div className="space-y-3">
          <div className="space-y-1 px-3">
            <p className="text-sm font-medium">Background reminders</p>
            <p className="text-sm text-muted-foreground">
              Only turn these on if you want reminders to keep working after you
              close the window.
            </p>
          </div>

          <ItemGroup className="gap-0">
            <Item className="py-2">
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

            <Item className="py-2">
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

            <Item className="py-2">
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
                  className="h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
