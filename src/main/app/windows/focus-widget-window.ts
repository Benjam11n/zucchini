import path from "node:path";

import { BrowserWindow } from "electron";

import {
  FOCUS_WIDGET_DEFAULT_HEIGHT,
  FOCUS_WIDGET_DEFAULT_WIDTH,
  getDefaultFocusWidgetBounds,
} from "./focus-widget-bounds";
import { configureWindowSecurity } from "./window-security";

interface CreateFocusWidgetWindowOptions {
  backgroundColor: string;
  iconPath?: string;
  getIsQuitting: () => boolean;
  onClosed: () => void;
}

export function createFocusWidgetWindow({
  backgroundColor,
  getIsQuitting,
  iconPath,
  onClosed,
}: CreateFocusWidgetWindowOptions): BrowserWindow {
  const preloadPath = path.join(__dirname, "../../preload.js");
  const appIndexPath = path.join(__dirname, "../../dist/index.html");
  const bounds = getDefaultFocusWidgetBounds();
  const window = new BrowserWindow({
    alwaysOnTop: true,
    backgroundColor,
    frame: false,
    fullscreenable: false,
    height: bounds.height,
    hiddenInMissionControl: true,
    icon: process.platform === "darwin" ? undefined : iconPath,
    maximizable: false,
    minHeight: FOCUS_WIDGET_DEFAULT_HEIGHT,
    minWidth: FOCUS_WIDGET_DEFAULT_WIDTH,
    minimizable: false,
    resizable: true,
    show: false,
    skipTaskbar: true,
    title: "Zucchini Focus Widget",
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
  });
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

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(`${process.env.VITE_DEV_SERVER_URL}?view=widget`);
  } else {
    void window.loadFile(appIndexPath, {
      search: "?view=widget",
    });
  }

  return window;
}
