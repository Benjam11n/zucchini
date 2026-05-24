import type { App } from "electron";
import { BrowserWindow, powerMonitor } from "electron";

import { shouldQuitWhenAllWindowsClosed } from "@/main/app/lifecycle";
import {
  acquireSingleInstanceLock,
  registerSecondInstanceHandler,
} from "@/main/app/single-instance";

interface ElectronLifecycleControllerOptions {
  app: App;
  bootstrap: () => void;
  cleanup: () => void;
  getTrayEnabled: () => boolean;
  isScreenshotMode: () => boolean;
  markQuitting: () => void;
  onActivate: () => void;
  onResume: () => void;
  showMainWindowWhenReady: () => void;
}

export class ElectronLifecycleController {
  private readonly options: ElectronLifecycleControllerOptions;

  constructor(options: ElectronLifecycleControllerOptions) {
    this.options = options;
  }

  start(): void {
    if (this.options.isScreenshotMode()) {
      this.options.bootstrap();
      this.registerAppLifecycleHooks();
      return;
    }

    if (acquireSingleInstanceLock(this.options.app)) {
      registerSecondInstanceHandler(this.options.app, () => {
        if (this.options.app.isReady()) {
          this.options.onActivate();
          return;
        }

        this.options.showMainWindowWhenReady();
      });
      this.options.bootstrap();
      this.registerAppLifecycleHooks();
      return;
    }

    this.options.app.quit();
  }

  private registerAppLifecycleHooks(): void {
    this.options.app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.options.onActivate();
        return;
      }

      this.options.onActivate();
    });

    powerMonitor.on("resume", () => {
      this.options.onResume();
    });

    this.options.app.on("before-quit", () => {
      this.options.markQuitting();
      this.options.cleanup();
    });

    this.options.app.on("window-all-closed", () => {
      if (
        shouldQuitWhenAllWindowsClosed({
          platform: process.platform,
          trayEnabled: this.options.getTrayEnabled(),
        })
      ) {
        this.options.app.quit();
      }
    });
  }
}
