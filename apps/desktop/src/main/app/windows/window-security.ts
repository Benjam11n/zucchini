/**
 * BrowserWindow security configuration.
 *
 * Prevents the renderer from opening new windows and blocks navigation
 * to untrusted origins. Only the Vite dev server URL (in development)
 * and `file://` protocol (in production) are permitted.
 */
import type { BrowserWindow } from "electron";

function isTrustedAppUrl(url: string): boolean {
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];
  if (devServerUrl) {
    return url.startsWith(devServerUrl);
  }

  return url.startsWith("file://");
}

export function configureWindowSecurity(win: BrowserWindow): void {
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  win.webContents.on("will-navigate", (event, url) => {
    if (isTrustedAppUrl(url)) {
      return;
    }

    event.preventDefault();
  });
}
