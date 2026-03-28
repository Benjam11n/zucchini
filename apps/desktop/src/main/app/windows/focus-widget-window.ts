import path from "node:path";

import { BrowserWindow } from "electron";

import {
  FOCUS_WIDGET_DEFAULT_HEIGHT,
  FOCUS_WIDGET_DEFAULT_WIDTH,
  getDefaultFocusWidgetBounds,
} from "./focus-widget-bounds";
import { configureWindowSecurity } from "./window-security";

interface CreateFocusWidgetWindowOptions {
  iconPath?: string;
  getIsQuitting: () => boolean;
  onClosed: () => void;
}

export function createFocusWidgetWindow({
  getIsQuitting,
  iconPath,
  onClosed,
}: CreateFocusWidgetWindowOptions): BrowserWindow {
  const preloadPath = path.join(__dirname, "preload.js");
  const appIndexPath = path.join(__dirname, "../dist/index.html");
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];

  async function loadWindowContent(window: BrowserWindow): Promise<void> {
    try {
      if (devServerUrl) {
        await window.loadURL(`${devServerUrl}?view=widget`);
        return;
      }

      await window.loadFile(appIndexPath, {
        search: "?view=widget",
      });
    } catch (error) {
      console.error("Failed to load the focus widget window.", error);
    }
  }
  const bounds = getDefaultFocusWidgetBounds();
  const windowOptions = {
    alwaysOnTop: true,
    backgroundColor: "#00000000",
    frame: false,
    fullscreenable: false,
    height: bounds.height,
    hiddenInMissionControl: true,
    maximizable: false,
    minHeight: FOCUS_WIDGET_DEFAULT_HEIGHT,
    minWidth: FOCUS_WIDGET_DEFAULT_WIDTH,
    minimizable: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    title: "Zucchini Focus Widget",
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      navigateOnDragDrop: false,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
      webSecurity: true,
    },
    width: bounds.width,
    x: bounds.x,
    y: bounds.y,
    ...(process.platform !== "darwin" && iconPath ? { icon: iconPath } : {}),
  } satisfies Electron.BrowserWindowConstructorOptions;
  const window = new BrowserWindow(windowOptions);
  configureWindowSecurity(window);

  window.setAlwaysOnTop(true, "floating");
  window.once("ready-to-show", () => {
    window.showInactive();
  });
  window.on("close", (event) => {
    if (getIsQuitting()) {
      return;
    }

    event.preventDefault();
    window.hide();
  });
  window.on("closed", onClosed);

  loadWindowContent(window);

  return window;
}
