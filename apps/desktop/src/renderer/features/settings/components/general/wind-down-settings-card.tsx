import { MoonStar } from "lucide-react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/components/ui/item";
import { Label } from "@/renderer/shared/components/ui/label";
import { TimeInput } from "@/renderer/shared/components/ui/time-input";

interface WindDownSettingsCardProps extends Pick<
  SettingsPageProps,
  "fieldErrors" | "onChange" | "settings"
> {
  onOpenWindDown: () => void;
}

export function WindDownSettingsCard({
  fieldErrors,
  onChange,
  onOpenWindDown,
  settings,
}: WindDownSettingsCardProps) {
  return (
    <Card>
      <SettingsCardHeader
        action={
          <Button
            onClick={onOpenWindDown}
            size="sm"
            type="button"
            variant="outline"
          >
            Open Wind Down
          </Button>
        }
        description="Evening routine"
        icon={MoonStar}
        title="Wind Down"
      />
      <CardContent className="space-y-3">
        <ItemGroup className="gap-0">
          <Item className="py-2">
            <ItemContent>
              <Label htmlFor="wind-down-time" className="text-sm font-medium">
                Reminder time
              </Label>
              <ItemDescription className="text-xs leading-snug">
                Zucchini reminds you automatically when wind down actions exist.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <TimeInput
                id="wind-down-time"
                onChange={(value) =>
                  onChange({ ...settings, windDownTime: value })
                }
                value={settings.windDownTime}
                {...(fieldErrors.windDownTime ? { "aria-invalid": true } : {})}
              />
            </ItemActions>
          </Item>
        </ItemGroup>

        {fieldErrors.windDownTime ? (
          <p className="text-sm text-destructive">{fieldErrors.windDownTime}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
