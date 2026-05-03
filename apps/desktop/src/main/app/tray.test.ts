import type * as ElectronModule from "electron";

import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { createAppTray } from "./tray";

type ElectronExports = typeof ElectronModule;

const trayState = vi.hoisted(() => ({
  clickHandler: null as null | (() => void),
  destroyCount: 0,
  lastMenu: null as null | ElectronModule.MenuItemConstructorOptions[],
  setContextMenuCount: 0,
  trayCount: 0,
}));

vi.mock("electron", async (importOriginal) => {
  const actual = (await importOriginal()) as ElectronExports;

  return {
    ...actual,
    Menu: {
      ...actual.Menu,
      buildFromTemplate: (
        template: ElectronModule.MenuItemConstructorOptions[]
      ) => template,
    },
    Tray: Object.assign(
      class {
        private readonly state = trayState;

        constructor() {
          trayState.trayCount += 1;
        }

        destroy = (): void => {
          this.state.destroyCount += 1;
        };

        on = (event: string, handler: () => void): void => {
          if (event === "click") {
            this.state.clickHandler = handler;
          }
        };

        setContextMenu = (
          menu: ElectronModule.MenuItemConstructorOptions[]
        ): void => {
          this.state.setContextMenuCount += 1;
          this.state.lastMenu = menu;
        };

        setToolTip = vi.fn();
      },
      actual.Tray
    ),
    app: {
      ...actual.app,
      getAppPath: () => "/mocked/app",
    },
    nativeImage: {
      ...actual.nativeImage,
      createFromPath: () => ({
        resize: () => ({}),
      }),
    },
  };
});

const baseSettings: AppSettings = {
  ...createDefaultAppSettings("Asia/Singapore"),
  launchAtLogin: false,
  minimizeToTray: false,
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

describe("createAppTray()", () => {
  function resetTrayState(): void {
    trayState.clickHandler = null;
    trayState.destroyCount = 0;
    trayState.lastMenu = null;
    trayState.setContextMenuCount = 0;
    trayState.trayCount = 0;
  }

  it("creates a tray when minimize-to-tray is enabled", () => {
    resetTrayState();
    const tray = createAppTray({
      onOpen: vi.fn(),
      onOpenWidget: vi.fn(),
      onQuit: vi.fn(),
      onSnooze: vi.fn(() => true),
    });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
    });

    expect(trayState.trayCount).toBe(1);
  });

  it("destroys the tray when minimize-to-tray is disabled", () => {
    resetTrayState();
    const tray = createAppTray({
      onOpen: vi.fn(),
      onOpenWidget: vi.fn(),
      onQuit: vi.fn(),
      onSnooze: vi.fn(() => true),
    });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
    });
    tray.applySettings(baseSettings);

    expect(trayState.destroyCount).toBe(1);
  });

  it("enables the snooze menu item when reminders are enabled", () => {
    resetTrayState();
    const tray = createAppTray({
      onOpen: vi.fn(),
      onOpenWidget: vi.fn(),
      onQuit: vi.fn(),
      onSnooze: vi.fn(() => true),
    });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
      reminderEnabled: true,
    });

    expect(trayState.lastMenu?.[3]).toMatchObject({
      enabled: true,
    });
  });

  it("disables the snooze menu item when reminders are disabled", () => {
    resetTrayState();
    const tray = createAppTray({
      onOpen: vi.fn(),
      onOpenWidget: vi.fn(),
      onQuit: vi.fn(),
      onSnooze: vi.fn(() => true),
    });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
      reminderEnabled: false,
    });

    expect(trayState.lastMenu?.[3]).toMatchObject({
      enabled: false,
    });
  });

  it("opens the main window when the tray icon is clicked", () => {
    resetTrayState();
    const onOpen = vi.fn();
    const tray = createAppTray({
      onOpen,
      onOpenWidget: vi.fn(),
      onQuit: vi.fn(),
      onSnooze: vi.fn(() => true),
    });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
    });
    trayState.clickHandler?.();

    expect(onOpen.mock.calls).toStrictEqual([[]]);
  });

  it("does not rebuild the tray menu for unrelated setting changes", () => {
    resetTrayState();
    const tray = createAppTray({
      onOpen: vi.fn(),
      onOpenWidget: vi.fn(),
      onQuit: vi.fn(),
      onSnooze: vi.fn(() => true),
    });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
    });
    tray.applySettings({
      ...baseSettings,
      focusDefaultDurationSeconds:
        baseSettings.focusDefaultDurationSeconds + 60,
      minimizeToTray: true,
    });

    expect(trayState.setContextMenuCount).toBe(1);
  });
});
