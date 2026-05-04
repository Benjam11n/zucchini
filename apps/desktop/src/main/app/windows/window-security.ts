/**
 * BrowserWindow security configuration.
 *
 * Prevents the renderer from opening new windows and blocks navigation
 * to untrusted origins. Only the Vite dev server URL (in development)
 * and the packaged renderer entrypoint (in production) are permitted.
 */
import type { BrowserWindow } from "electron";

interface ConfigureWindowSecurityOptions {
  productionAppUrl: string;
}

function stripHash(url: URL): string {
  url.hash = "";
  return url.toString();
}

function isTrustedDevServerUrl(url: string, devServerUrl: string): boolean {
  try {
    const candidate = new URL(url);
    const trusted = new URL(devServerUrl);
    return candidate.origin === trusted.origin;
  } catch {
    return false;
  }
}

function isTrustedAppUrl(url: string, productionAppUrl: string): boolean {
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];
  if (devServerUrl) {
    return isTrustedDevServerUrl(url, devServerUrl);
  }

  try {
    return stripHash(new URL(url)) === stripHash(new URL(productionAppUrl));
  } catch {
    return false;
  }
}

export function configureWindowSecurity(
  win: BrowserWindow,
  { productionAppUrl }: ConfigureWindowSecurityOptions
): void {
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  win.webContents.on("will-navigate", (event, url) => {
    if (isTrustedAppUrl(url, productionAppUrl)) {
      return;
    }

    event.preventDefault();
  });
}
