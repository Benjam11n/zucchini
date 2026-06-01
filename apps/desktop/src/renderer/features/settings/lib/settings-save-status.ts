import type { SettingsPageViewModel } from "@/renderer/features/settings/settings.types";

export function getSettingsSaveStatus(
  savePhase: SettingsPageViewModel["savePhase"]
) {
  if (savePhase === "pending") {
    return { text: "Unsaved changes", variant: "outline" as const };
  }

  if (savePhase === "invalid") {
    return {
      text: "Fix highlighted settings",
      variant: "destructive" as const,
    };
  }

  if (savePhase === "saving") {
    return { text: "Saving...", variant: "secondary" as const };
  }

  if (savePhase === "saved") {
    return null;
  }

  if (savePhase === "error") {
    return { text: "Save failed", variant: "destructive" as const };
  }

  return null;
}
