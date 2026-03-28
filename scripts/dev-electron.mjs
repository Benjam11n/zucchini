import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { watch } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import waitOn from "wait-on";

import { desktopDir, resolveElectronPath } from "./electron-launcher.mjs";

const port = Number(process.env.ELECTRON_RENDERER_PORT ?? 5173);
const devServerUrl = `http://localhost:${port}`;
const requiredFiles = ["dist-electron/main.js", "dist-electron/preload.js"];
const watchedDirectories = [
  { directory: "dist-electron", files: new Set(["main.js", "preload.js"]) },
];
const forcedShutdownTimeoutMs = 1500;
const restartDebounceMs = 120;
const childTreeGracePeriodMs = 1200;

await waitOn({
  resources: [
    `tcp:${port}`,
    ...requiredFiles.map((filePath) => `file:${filePath}`),
  ],
});

const childEnv = { ...process.env };
delete childEnv.ELECTRON_RUN_AS_NODE;

let shuttingDown = false;
let restartTimer = null;
let currentApp = null;
let restartQueue = Promise.resolve();
const expectedExits = new WeakSet();
const watchers = [];
let launchCount = 0;

function killChildTreeByPid(pid, signal) {
  if (process.platform === "win32" || typeof pid !== "number") {
    return;
  }

  spawnSync("pkill", [`-${signal}`, "-P", String(pid)], { stdio: "ignore" });
}

function cleanupStaleDevApps() {
  if (process.platform === "win32") {
    return;
  }

  spawnSync("pkill", ["-f", "--", `--zucchini-dev-root=${desktopDir}`], {
    stdio: "ignore",
  });
}

function startApp() {
  if (shuttingDown || currentApp !== null) {
    return;
  }

  const app = spawn(
    resolveElectronPath(),
    [`--zucchini-dev-root=${desktopDir}`, "dist-electron/main.js"],
    {
      cwd: desktopDir,
      env: {
        ...childEnv,
        VITE_DEV_SERVER_URL: devServerUrl,
        ZUCCHINI_ELECTRON_RESTART: launchCount > 0 ? "true" : "false",
      },
      stdio: "inherit",
    }
  );

  currentApp = app;
  launchCount += 1;

  app.once("error", () => {
    if (currentApp === app) {
      currentApp = null;
    }

    if (!shuttingDown) {
      scheduleRestart();
    }
  });

  app.once("exit", () => {
    if (currentApp === app) {
      currentApp = null;
    }

    if (!shuttingDown && !expectedExits.has(app)) {
      scheduleRestart();
    }
  });
}

async function stopApp() {
  const app = currentApp;
  if (!app) {
    return;
  }

  currentApp = null;
  expectedExits.add(app);

  const exitPromise = once(app, "exit");

  app.kill("SIGTERM");
  killChildTreeByPid(app.pid, "TERM");

  const exitedGracefully = await Promise.race([
    exitPromise.then(() => true),
    delay(forcedShutdownTimeoutMs, false),
  ]);

  if (exitedGracefully) {
    return;
  }

  app.kill("SIGKILL");
  killChildTreeByPid(app.pid, "KILL");
  await exitPromise;
}

function scheduleRestart() {
  if (shuttingDown) {
    return;
  }

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;
    restartQueue = restartQueue
      .catch(() => null)
      .then(async () => {
        await stopApp();
        if (!shuttingDown) {
          startApp();
        }
      });
  }, restartDebounceMs);
}

function startWatchers() {
  for (const { directory, files } of watchedDirectories) {
    const watcher = watch(
      join(desktopDir, directory),
      { persistent: true },
      (_eventType, filename) => {
        if (typeof filename !== "string" || !files.has(filename)) {
          return;
        }

        scheduleRestart();
      }
    );

    watchers.push(watcher);
  }
}

function killChildTree(signal) {
  if (process.platform === "win32") {
    return;
  }

  // Kill direct children as a final fallback in case normal shutdown leaves stragglers.
  spawnSync("pkill", [`-${signal}`, "-P", String(process.pid)], {
    stdio: "ignore",
  });
}

async function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  for (const watcher of watchers) {
    watcher.close();
  }

  await stopApp();
  killChildTree("TERM");
  await delay(childTreeGracePeriodMs);
  killChildTree("KILL");

  process.exit(exitCode);
}

startWatchers();
cleanupStaleDevApps();
startApp();

process.once("SIGINT", () => {
  shutdown(130).catch(reportAppReadyFailure);
});
process.once("SIGTERM", () => {
  shutdown(143).catch(reportAppReadyFailure);
});
process.once("SIGHUP", () => {
  shutdown(129).catch(reportAppReadyFailure);
});
