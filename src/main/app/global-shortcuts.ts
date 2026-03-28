import type {
  FocusTimerAction,
  FocusTimerShortcutRegistration,
  FocusTimerShortcutStatus,
} from "@/shared/contracts/habits-ipc";
import type { AppSettings } from "@/shared/domain/settings";

const SHORTCUT_REGISTRATION_ERROR =
  "This shortcut could not be registered. It may already be in use by another app.";

type GlobalShortcutAction = FocusTimerAction;

interface GlobalShortcutLike {
  isRegistered: (accelerator: string) => boolean;
  register: (accelerator: string, callback: () => void) => boolean;
  unregister: (accelerator: string) => void;
}

interface ActiveShortcutRegistration {
  accelerator: string;
  callback: () => void;
}

function getShortcutSettings(
  settings: Pick<
    AppSettings,
    "resetFocusTimerShortcut" | "toggleFocusTimerShortcut"
  >
): Record<GlobalShortcutAction, string> {
  return {
    reset: settings.resetFocusTimerShortcut,
    toggle: settings.toggleFocusTimerShortcut,
  };
}

function createShortcutRegistration(
  accelerator: string
): FocusTimerShortcutRegistration {
  return {
    accelerator,
    activeAccelerator: null,
    errorMessage: null,
    isRegistered: false,
  };
}

export interface FocusTimerGlobalShortcutManager {
  getStatus: () => FocusTimerShortcutStatus;
  register: (
    settings: Pick<
      AppSettings,
      "resetFocusTimerShortcut" | "toggleFocusTimerShortcut"
    >
  ) => FocusTimerShortcutStatus;
  unregisterAll: () => void;
}

export function createFocusTimerGlobalShortcutManager({
  globalShortcut,
  onAction,
}: {
  globalShortcut: GlobalShortcutLike;
  onAction: (action: GlobalShortcutAction) => void;
}): FocusTimerGlobalShortcutManager {
  const activeRegistrations = new Map<
    GlobalShortcutAction,
    ActiveShortcutRegistration
  >();
  let status: FocusTimerShortcutStatus = {
    reset: createShortcutRegistration(""),
    toggle: createShortcutRegistration(""),
  };

  function unregisterAction(action: GlobalShortcutAction) {
    const existingRegistration = activeRegistrations.get(action);

    if (!existingRegistration) {
      return;
    }

    if (globalShortcut.isRegistered(existingRegistration.accelerator)) {
      globalShortcut.unregister(existingRegistration.accelerator);
    }

    activeRegistrations.delete(action);
  }

  function registerAction(
    action: GlobalShortcutAction,
    accelerator: string
  ): FocusTimerShortcutRegistration {
    const existingRegistration = activeRegistrations.get(action);

    if (existingRegistration?.accelerator === accelerator) {
      return {
        accelerator,
        activeAccelerator: accelerator,
        errorMessage: null,
        isRegistered: true,
      };
    }

    if (existingRegistration) {
      unregisterAction(action);
    }

    const callback = () => {
      onAction(action);
    };
    const registered = globalShortcut.register(accelerator, callback);

    if (registered) {
      activeRegistrations.set(action, {
        accelerator,
        callback,
      });

      return {
        accelerator,
        activeAccelerator: accelerator,
        errorMessage: null,
        isRegistered: true,
      };
    }

    if (existingRegistration) {
      const restored = globalShortcut.register(
        existingRegistration.accelerator,
        existingRegistration.callback
      );

      if (restored) {
        activeRegistrations.set(action, existingRegistration);
      }
    }

    return {
      accelerator,
      activeAccelerator: activeRegistrations.get(action)?.accelerator ?? null,
      errorMessage: SHORTCUT_REGISTRATION_ERROR,
      isRegistered: false,
    };
  }

  return {
    getStatus() {
      return status;
    },
    register(settings) {
      const requestedShortcuts = getShortcutSettings(settings);
      status = {
        reset: registerAction("reset", requestedShortcuts.reset),
        toggle: registerAction("toggle", requestedShortcuts.toggle),
      };
      return status;
    },
    unregisterAll() {
      unregisterAction("reset");
      unregisterAction("toggle");
      status = {
        reset: createShortcutRegistration(""),
        toggle: createShortcutRegistration(""),
      };
    },
  };
}
