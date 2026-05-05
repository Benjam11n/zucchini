import type { AppTrayShellPort } from "@/main/app/ports";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { createAppTray } from "./tray";

const baseSettings: AppSettings = {
  ...createDefaultAppSettings("Asia/Singapore"),
  launchAtLogin: false,
  minimizeToTray: false,
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

function createTrayShellHarness() {
  const state = {
    clickHandler: null as null | (() => void),
    destroyCount: 0,
    lastMenu: null as unknown[] | null,
    setContextMenuCount: 0,
    trayCount: 0,
  };

  const shell: AppTrayShellPort = {
    buildMenuFromTemplate: (template) => template as never,
    createImageFromPath: () =>
      ({
        resize: () => ({}),
      }) as never,
    createTray: () => {
      state.trayCount += 1;
      return {
        destroy: () => {
          state.destroyCount += 1;
        },
        on: (event: string, handler: () => void) => {
          if (event === "click") {
            state.clickHandler = handler;
          }
        },
        setContextMenu: (menu: unknown) => {
          state.setContextMenuCount += 1;
          state.lastMenu = menu as unknown[];
        },
        setToolTip: vi.fn(),
      } as never;
    },
    resolveIconPath: () => "/mocked/icon.png",
  };

  return { shell, state };
}

function createTray(options: {
  onOpen?: () => void;
  onOpenWidget?: () => void;
  onQuit?: () => void;
  onSnooze?: (settings: AppSettings) => boolean;
  shell: AppTrayShellPort;
}) {
  return createAppTray({
    onOpen: options.onOpen ?? vi.fn(),
    onOpenWidget: options.onOpenWidget ?? vi.fn(),
    onQuit: options.onQuit ?? vi.fn(),
    onSnooze: options.onSnooze ?? vi.fn(() => true),
    shell: options.shell,
  });
}

describe("createAppTray()", () => {
  it("creates a tray when minimize-to-tray is enabled", () => {
    const { shell, state } = createTrayShellHarness();
    const tray = createTray({ shell });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
    });

    expect(state.trayCount).toBe(1);
  });

  it("destroys the tray when minimize-to-tray is disabled", () => {
    const { shell, state } = createTrayShellHarness();
    const tray = createTray({ shell });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
    });
    tray.applySettings(baseSettings);

    expect(state.destroyCount).toBe(1);
  });

  it("enables the snooze menu item when reminders are enabled", () => {
    const { shell, state } = createTrayShellHarness();
    const tray = createTray({ shell });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
      reminderEnabled: true,
    });

    expect(state.lastMenu?.[3]).toMatchObject({
      enabled: true,
    });
  });

  it("disables the snooze menu item when reminders are disabled", () => {
    const { shell, state } = createTrayShellHarness();
    const tray = createTray({ shell });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
      reminderEnabled: false,
    });

    expect(state.lastMenu?.[3]).toMatchObject({
      enabled: false,
    });
  });

  it("opens the main window when the tray icon is clicked", () => {
    const { shell, state } = createTrayShellHarness();
    const onOpen = vi.fn();
    const tray = createTray({ onOpen, shell });

    tray.applySettings({
      ...baseSettings,
      minimizeToTray: true,
    });
    state.clickHandler?.();

    expect(onOpen.mock.calls).toStrictEqual([[]]);
  });

  it("does not rebuild the tray menu for unrelated setting changes", () => {
    const { shell, state } = createTrayShellHarness();
    const tray = createTray({ shell });

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

    expect(state.setContextMenuCount).toBe(1);
  });
});
