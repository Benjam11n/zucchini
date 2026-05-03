import { Menu, Tray, nativeImage } from "electron";

import type { AppTrayShellPort } from "@/main/app/ports";

import { resolveRuntimeIconPath } from "./assets";

export const electronAppTrayShell: AppTrayShellPort = {
  buildMenuFromTemplate: (template) => Menu.buildFromTemplate(template),
  createImageFromPath: (assetPath) => nativeImage.createFromPath(assetPath),
  createTray: (image) => new Tray(image),
  resolveIconPath: resolveRuntimeIconPath,
};
