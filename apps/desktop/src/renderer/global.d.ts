import type { DesktopApi } from "@/shared/contracts/api/desktop-api";
import type { AppUpdaterApi } from "@/shared/contracts/app-updater";

declare global {
  interface Window {
    desktop: DesktopApi;
    updater: AppUpdaterApi;
  }
}
