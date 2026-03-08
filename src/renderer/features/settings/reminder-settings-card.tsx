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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
      <CardContent className="grid gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="reminder-enabled" className="font-normal">
              Enable reminder
            </Label>
            <Switch
              checked={settings.reminderEnabled}
              id="reminder-enabled"
              onCheckedChange={(checked) =>
                onChange({ ...settings, reminderEnabled: checked })
              }
            />
          </div>

          {settings.reminderEnabled && permission !== "granted" && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>Notifications are currently disabled.</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-destructive/50 text-xs hover:bg-destructive/20"
                onClick={() => {
                  void requestPermission();
                }}
              >
                Request
              </Button>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="reminder-time" className="font-normal">
              Time
            </Label>
            <TimeInput
              id="reminder-time"
              onChange={(val) => onChange({ ...settings, reminderTime: val })}
              value={settings.reminderTime}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reminder-timezone" className="font-normal">
              Timezone
            </Label>
            <Input
              id="reminder-timezone"
              onChange={(event) =>
                onChange({ ...settings, timezone: event.target.value })
              }
              type="text"
              value={settings.timezone}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
