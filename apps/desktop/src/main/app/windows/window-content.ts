import path from "node:path";
import { pathToFileURL } from "node:url";

import type { BrowserWindow } from "electron";

interface LoadWindowContentOptions {
  appIsPackaged: boolean;
  errorMessage: string;
  search?: string;
  window: BrowserWindow;
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

function parseTrustedDevServerUrl(devServerUrl: string): URL | null {
  try {
    const url = new URL(devServerUrl);
    if (
      url.protocol !== "http:" ||
      !url.port ||
      !LOOPBACK_HOSTS.has(url.hostname)
    ) {
      return null;
    }

    url.hash = "";
    url.search = "";
    return url;
  } catch {
    return null;
  }
}

export function getTrustedDevServerUrl({
  appIsPackaged,
  devServerUrl = process.env["VITE_DEV_SERVER_URL"],
}: {
  appIsPackaged: boolean;
  devServerUrl?: string;
}): URL | null {
  if (appIsPackaged || !devServerUrl) {
    return null;
  }

  return parseTrustedDevServerUrl(devServerUrl);
}

export function getProductionAppUrl(search = ""): string {
  const appIndexPath = path.join(__dirname, "../dist/index.html");
  const appUrl = pathToFileURL(appIndexPath);
  appUrl.search = search;
  return appUrl.toString();
}

export function getWindowContentUrl({
  appIsPackaged,
  search = "",
}: {
  appIsPackaged: boolean;
  search?: string;
}): string {
  const devServerUrl = getTrustedDevServerUrl({ appIsPackaged });

  if (devServerUrl) {
    devServerUrl.search = search;
    return devServerUrl.toString();
  }

  return getProductionAppUrl(search);
}

export async function loadWindowContent({
  appIsPackaged,
  errorMessage,
  search,
  window,
}: LoadWindowContentOptions): Promise<void> {
  try {
    await window.loadURL(
      getWindowContentUrl({
        appIsPackaged,
        ...(search === undefined ? {} : { search }),
      })
    );
  } catch (error) {
    console.error(errorMessage, error);
  }
}
