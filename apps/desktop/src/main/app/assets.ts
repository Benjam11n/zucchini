import path from "node:path";

import { app } from "electron";

function resolveMainAssetPath(...segments: string[]): string {
  return path.join(app.getAppPath(), ...segments);
}

export function resolveMascotAssetPath(filename: string): string {
  const assetBaseDir = app.isPackaged
    ? ["dist", "mascot"]
    : ["public", "mascot"];
  return resolveMainAssetPath(...assetBaseDir, filename);
}

export function resolveRuntimeIconPath(): string {
  return resolveMainAssetPath("build", "icon.png");
}
