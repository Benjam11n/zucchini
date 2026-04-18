import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);
const APP_DISPLAY_NAME = isDevelopment ? "Zucchini (Dev)" : "Zucchini";
const APP_BUNDLE_ID = "com.zucchini.habittracker";
const APP_ICON_NAME = "icon.icns";
const LAUNCHER_VERSION = 5;

const __dirname = import.meta.dirname;
export const desktopDir = resolve(__dirname, "..");

function setPlistString(plistPath, key, value) {
  const replaceResult = spawnSync(
    "plutil",
    ["-replace", key, "-string", value, plistPath],
    {
      encoding: "utf-8",
    }
  );
  if (replaceResult.status === 0) {
    return;
  }

  const insertResult = spawnSync(
    "plutil",
    ["-insert", key, "-string", value, plistPath],
    {
      encoding: "utf-8",
    }
  );
  if (insertResult.status === 0) {
    return;
  }

  const details = [replaceResult.stderr, insertResult.stderr]
    .filter(Boolean)
    .join("\n");
  throw new Error(
    `Failed to update plist key "${key}" at ${plistPath}: ${details}`.trim()
  );
}

function patchMainBundleInfoPlist(appBundlePath, hasCustomIcon) {
  const infoPlistPath = join(appBundlePath, "Contents", "Info.plist");
  setPlistString(infoPlistPath, "CFBundleDisplayName", APP_DISPLAY_NAME);
  setPlistString(infoPlistPath, "CFBundleName", APP_DISPLAY_NAME);
  setPlistString(infoPlistPath, "CFBundleIdentifier", APP_BUNDLE_ID);
  if (hasCustomIcon) {
    setPlistString(infoPlistPath, "CFBundleIconFile", APP_ICON_NAME);
  }
}

function patchMainBundleIcon(appBundlePath) {
  const sourceIconPath = join(desktopDir, "build", APP_ICON_NAME);
  if (!existsSync(sourceIconPath)) {
    return;
  }

  const targetIconPath = join(
    appBundlePath,
    "Contents",
    "Resources",
    APP_ICON_NAME
  );
  copyFileSync(sourceIconPath, targetIconPath);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function buildMacLauncher(electronBinaryPath) {
  const sourceAppBundlePath = resolve(electronBinaryPath, "../../..");
  const runtimeDir = join(desktopDir, ".electron-runtime");
  const targetAppBundlePath = join(runtimeDir, `${APP_DISPLAY_NAME}.app`);
  const sourceIconPath = join(desktopDir, "build", APP_ICON_NAME);
  const hasCustomIcon = existsSync(sourceIconPath);
  const targetBinaryPath = join(
    targetAppBundlePath,
    "Contents",
    "MacOS",
    "Electron"
  );
  const metadataPath = join(runtimeDir, "metadata.json");

  mkdirSync(runtimeDir, { recursive: true });

  const expectedMetadata = {
    iconMtimeMs: hasCustomIcon ? statSync(sourceIconPath).mtimeMs : 0,
    launcherVersion: LAUNCHER_VERSION,
    sourceAppBundlePath,
    sourceAppMtimeMs: statSync(sourceAppBundlePath).mtimeMs,
  };

  const currentMetadata = readJson(metadataPath);
  if (
    existsSync(targetBinaryPath) &&
    currentMetadata &&
    JSON.stringify(currentMetadata) === JSON.stringify(expectedMetadata)
  ) {
    return targetBinaryPath;
  }

  rmSync(targetAppBundlePath, { force: true, recursive: true });
  const copyResult = spawnSync(
    "cp",
    ["-R", sourceAppBundlePath, targetAppBundlePath],
    {
      encoding: "utf-8",
    }
  );
  if (copyResult.status !== 0) {
    throw new Error(
      `Failed to copy Electron app bundle: ${copyResult.stderr || copyResult.stdout}`.trim()
    );
  }
  patchMainBundleInfoPlist(targetAppBundlePath, hasCustomIcon);
  patchMainBundleIcon(targetAppBundlePath);
  writeFileSync(metadataPath, `${JSON.stringify(expectedMetadata, null, 2)}\n`);

  return targetBinaryPath;
}

export function resolveElectronPath() {
  const require = createRequire(import.meta.url);
  const electronBinaryPath = require("electron");

  if (process.platform !== "darwin") {
    return electronBinaryPath;
  }

  return buildMacLauncher(electronBinaryPath);
}
