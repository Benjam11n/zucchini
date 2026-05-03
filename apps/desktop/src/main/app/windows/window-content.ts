import path from "node:path";

import type { BrowserWindow } from "electron";

interface LoadWindowContentOptions {
  errorMessage: string;
  search?: string;
  window: BrowserWindow;
}

export async function loadWindowContent({
  errorMessage,
  search,
  window,
}: LoadWindowContentOptions): Promise<void> {
  const appIndexPath = path.join(__dirname, "../dist/index.html");
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];

  try {
    if (devServerUrl) {
      await window.loadURL(`${devServerUrl}${search ?? ""}`);
      return;
    }

    await window.loadFile(appIndexPath, search ? { search } : undefined);
  } catch (error) {
    console.error(errorMessage, error);
  }
}
