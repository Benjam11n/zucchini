import { Monitor, MoonStar, SunMedium } from "lucide-react";
import type { ElementType } from "react";

import type { ThemeMode } from "@/shared/domain/settings";

export const THEME_OPTIONS: {
  icon: ElementType;
  label: string;
  value: ThemeMode;
}[] = [
  {
    icon: SunMedium,
    label: "Light",
    value: "light",
  },
  {
    icon: MoonStar,
    label: "Dark",
    value: "dark",
  },
  {
    icon: Monitor,
    label: "System",
    value: "system",
  },
];
