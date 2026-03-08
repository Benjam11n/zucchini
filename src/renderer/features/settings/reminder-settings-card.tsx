import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TimeInput } from "@/components/ui/time-input";

import type { SettingsPageProps } from "./types";

export function ReminderSettingsCard({
  onChange,
  settings,
}: Pick<SettingsPageProps, "onChange" | "settings">) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof Notification !== "undefined") {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>Settings</CardDescription>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <CardTitle>Reminders</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          <Item>
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
                {settings.reminderEnabled && permission !== "granted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-destructive/50 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      void requestPermission();
                    }}
                  >
                    Allow Notifications
                  </Button>
                )}
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

          <ItemSeparator />

          <Item>
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
              />
            </ItemActions>
          </Item>

          <Item>
            <ItemContent>
              <Label
                htmlFor="reminder-timezone"
                className="text-sm font-medium"
              >
                Timezone
              </Label>
              <ItemDescription>Your local timezone.</ItemDescription>
            </ItemContent>
            <ItemActions className="max-w-[140px]">
              <Input
                id="reminder-timezone"
                className="text-center"
                onChange={(event) =>
                  onChange({ ...settings, timezone: event.target.value })
                }
                type="text"
                value={settings.timezone}
              />
            </ItemActions>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
