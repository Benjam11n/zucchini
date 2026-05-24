import {
  app,
  dialog,
  ipcMain,
  session as electronSession,
  shell,
} from "electron";
import { autoUpdater } from "electron-updater";

import { createDesktopLogger } from "@/main/app/logger";
import { MainProcessRuntime } from "@/main/app/main-process-runtime";
import { configureScreenshotUserDataPath } from "@/main/app/screenshot-mode";

configureScreenshotUserDataPath(app);

const logger = createDesktopLogger({
  app,
});

new MainProcessRuntime({
  app,
  autoUpdater,
  dialog,
  getDefaultSession: () => electronSession.defaultSession,
  ipcMain,
  logger,
  shell,
}).start();
