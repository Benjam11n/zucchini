import { createFocusTimerGlobalShortcutManager } from "@/main/app/global-shortcuts";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";

function createSettings(overrides?: {
  resetFocusTimerShortcut?: string;
  toggleFocusTimerShortcut?: string;
}) {
  return {
    resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
    toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
    ...overrides,
  };
}

function createGlobalShortcutMock() {
  const callbacks = new Map<string, () => void>();
  const rejectedAccelerators = new Set<string>();

  return {
    callbacks,
    isRegistered(accelerator: string) {
      return callbacks.has(accelerator);
    },
    // Electron's API is callback-based; the mock mirrors that surface.
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    register(accelerator: string, callback: () => void) {
      if (rejectedAccelerators.has(accelerator)) {
        return false;
      }

      callbacks.set(accelerator, callback);
      return true;
    },
    reject(accelerator: string) {
      rejectedAccelerators.add(accelerator);
    },
    unregister(accelerator: string) {
      callbacks.delete(accelerator);
    },
  };
}

describe("createFocusTimerGlobalShortcutManager()", () => {
  it("registers both focus timer shortcuts", () => {
    const globalShortcut = createGlobalShortcutMock();
    const onAction = vi.fn();
    const manager = createFocusTimerGlobalShortcutManager({
      globalShortcut,
      onAction,
    });

    const status = manager.register(createSettings());

    expect(status).toStrictEqual({
      reset: {
        accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        errorMessage: null,
        isRegistered: true,
      },
      toggle: {
        accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
        activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
        errorMessage: null,
        isRegistered: true,
      },
    });

    globalShortcut.callbacks.get(
      FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle
    )?.();
    expect(onAction).toHaveBeenCalledWith("toggle");
  });

  it("re-registers shortcuts when settings change", () => {
    const globalShortcut = createGlobalShortcutMock();
    const manager = createFocusTimerGlobalShortcutManager({
      globalShortcut,
      onAction: vi.fn(),
    });

    manager.register(createSettings());
    manager.register(
      createSettings({
        toggleFocusTimerShortcut: "Command+Option+Space",
      })
    );

    expect(
      globalShortcut.isRegistered(FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle)
    ).toBeFalsy();
    expect(globalShortcut.isRegistered("Command+Option+Space")).toBeTruthy();
  });

  it("preserves the previous active shortcut when a new registration fails", () => {
    const globalShortcut = createGlobalShortcutMock();
    const manager = createFocusTimerGlobalShortcutManager({
      globalShortcut,
      onAction: vi.fn(),
    });

    manager.register(createSettings());
    globalShortcut.reject("Command+Option+Space");

    const status = manager.register(
      createSettings({
        toggleFocusTimerShortcut: "Command+Option+Space",
      })
    );

    expect(status.toggle).toStrictEqual({
      accelerator: "Command+Option+Space",
      activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
      errorMessage:
        "This shortcut could not be registered. It may already be in use by another app.",
      isRegistered: false,
    });
    expect(
      globalShortcut.isRegistered(FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle)
    ).toBeTruthy();
  });

  it("unregisters all managed shortcuts", () => {
    const globalShortcut = createGlobalShortcutMock();
    const manager = createFocusTimerGlobalShortcutManager({
      globalShortcut,
      onAction: vi.fn(),
    });

    manager.register(createSettings());
    manager.unregisterAll();

    expect(globalShortcut.callbacks.size).toBe(0);
    expect(manager.getStatus()).toStrictEqual({
      reset: {
        accelerator: "",
        activeAccelerator: null,
        errorMessage: null,
        isRegistered: false,
      },
      toggle: {
        accelerator: "",
        activeAccelerator: null,
        errorMessage: null,
        isRegistered: false,
      },
    });
  });
});
