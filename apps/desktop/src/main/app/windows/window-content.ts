import path from "node:path";
import { pathToFileURL } from "node:url";

import type { BrowserWindow } from "electron";

interface LoadWindowContentOptions {
  errorMessage: string;
  search?: string;
  window: BrowserWindow;
}

export function getProductionAppUrl(search = ""): string {
  const appIndexPath = path.join(__dirname, "../dist/index.html");
  const appUrl = pathToFileURL(appIndexPath);
  appUrl.search = search;
  return appUrl.toString();
}

export async function loadWindowContent({
  errorMessage,
  search,
  window,
}: LoadWindowContentOptions): Promise<void> {
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];

  try {
    if (devServerUrl) {
      await window.loadURL(`${devServerUrl}${search ?? ""}`);
      return;
    }

    await window.loadURL(getProductionAppUrl(search));
  } catch (error) {
    console.error(errorMessage, error);
  }
}
