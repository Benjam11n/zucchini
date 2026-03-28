import type * as ElectronModule from "electron";

import type { AppSettings } from "@/shared/domain/settings";

import { createAppTray } from "./tray";

type ElectronExports = typeof ElectronModule;

const trayState = vi.hoisted(() => ({
  clickHandler: null as null | (() => void),
  destroyCount: 0,
  lastMenu: null as null | ElectronModule.MenuItemConstructorOptions[],
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
        constructor() {
          trayState.trayCount += 1;
        }

        // oxlint-disable-next-line class-methods-use-this
        destroy(): void {
          trayState.destroyCount += 1;
        }

        // oxlint-disable-next-line class-methods-use-this
        on(event: string, handler: () => void): void {
          if (event === "click") {
            trayState.clickHandler = handler;
          }
        }

        // oxlint-disable-next-line class-methods-use-this
        setContextMenu(
          menu: ElectronModule.MenuItemConstructorOptions[]
        ): void {
          trayState.lastMenu = menu;
        }

        // oxlint-disable-next-line class-methods-use-this
        setToolTip(): void {}
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
  focusCyclesBeforeLongBreak: 4,
  focusDefaultDurationSeconds: 1500,
  focusLongBreakSeconds: 15 * 60,
  focusShortBreakSeconds: 5 * 60,
  launchAtLogin: false,
  minimizeToTray: false,
  reminderEnabled: true,
  reminderSnoozeMinutes: 15,
  reminderTime: "20:30",
  themeMode: "system",
  timezone: "Asia/Singapore",
};

describe("createAppTray()", () => {
  function resetTrayState(): void {
    trayState.clickHandler = null;
    trayState.destroyCount = 0;
    trayState.lastMenu = null;
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
});
