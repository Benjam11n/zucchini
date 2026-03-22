import path from "node:path";

import { BrowserWindow } from "electron";

import { configureWindowSecurity } from "./window-security";

interface CreateMainWindowOptions {
  backgroundColor: string;
  iconPath?: string;
  getIsQuitting: () => boolean;
  onClosed: () => void;
  shouldHideToTray: (input: { isQuitting: boolean }) => boolean;
}

export function createMainWindow({
  backgroundColor,
  getIsQuitting,
  iconPath,
  onClosed,
  shouldHideToTray,
}: CreateMainWindowOptions): BrowserWindow {
  const preloadPath = path.join(__dirname, "../../preload.js");
  const appIndexPath = path.join(__dirname, "../../dist/index.html");
  const shouldShowInactive =
    process.env.ZUCCHINI_ELECTRON_RESTART === "true" &&
    process.platform === "darwin";
  const window = new BrowserWindow({
    backgroundColor,
    height: 760,
    icon: process.platform === "darwin" ? undefined : iconPath,
    minHeight: 640,
    minWidth: 900,
    show: !shouldShowInactive,
    title: "Zucchini",
    webPreferences: {
      contextIsolation: true,
      navigateOnDragDrop: false,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
      webSecurity: true,
    },
    width: 1100,
  });
  configureWindowSecurity(window);

  window.on("close", (event) => {
    const isQuitting = getIsQuitting();
    if (!shouldHideToTray({ isQuitting })) {
      return;
    }

    event.preventDefault();
    window.hide();
  });
  window.on("closed", onClosed);

  if (shouldShowInactive) {
    window.once("ready-to-show", () => {
      window.showInactive();
    });
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(appIndexPath);
  }

  return window;
}
