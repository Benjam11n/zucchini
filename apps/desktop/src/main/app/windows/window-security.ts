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
