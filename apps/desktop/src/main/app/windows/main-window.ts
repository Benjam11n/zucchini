/**
 * Main application window creation.
 *
 * Creates the primary BrowserWindow with title bar configuration,
 * minimum dimensions, and close-to-tray behavior. The window loads
 * the renderer's `index.html` (or the Vite dev server in development).
 */
import path from "node:path";

import { BrowserWindow } from "electron";

import { configureWindowSecurity } from "./window-security";

const MAIN_WINDOW_DEFAULT_WIDTH = 1040;
const MAIN_WINDOW_MIN_WIDTH = 720;
const MAIN_WINDOW_DEFAULT_HEIGHT = 820;
const MAIN_WINDOW_MIN_HEIGHT = 640;

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
  const preloadPath = path.join(__dirname, "preload.js");
  const appIndexPath = path.join(__dirname, "../dist/index.html");
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];

  async function loadWindowContent(window: BrowserWindow): Promise<void> {
    try {
      if (devServerUrl) {
        await window.loadURL(devServerUrl);
        return;
      }

      await window.loadFile(appIndexPath);
    } catch (error) {
      console.error("Failed to load the main window.", error);
    }
  }
  const shouldShowInactive =
    process.env["ZUCCHINI_ELECTRON_RESTART"] === "true" &&
    process.platform === "darwin";
  const windowOptions = {
    backgroundColor,
    height: MAIN_WINDOW_DEFAULT_HEIGHT,
    minHeight: MAIN_WINDOW_MIN_HEIGHT,
    minWidth: MAIN_WINDOW_MIN_WIDTH,
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
    width: MAIN_WINDOW_DEFAULT_WIDTH,
    ...(process.platform !== "darwin" && iconPath ? { icon: iconPath } : {}),
  } satisfies Electron.BrowserWindowConstructorOptions;
  const window = new BrowserWindow(windowOptions);
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

  loadWindowContent(window);

  return window;
}
