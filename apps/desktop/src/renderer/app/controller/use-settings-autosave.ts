/**
 * Settings auto-save behavior hook.
 *
 * Watches the settings draft for changes, validates against the Zod schema,
 * and debounces saves (600 ms) through the controller's `handleUpdateSettings`
 * action. Tracks save phase transitions (idle → pending → saving → saved/error)
 * and surfaces validation errors at the field level.
 */
import { useEffect, useRef } from "react";

import type { createAppActions } from "@/renderer/app/controller/app-actions";
import type { AppControllerState } from "@/renderer/app/controller/app-controller.types";
import {
  areAppSettingsEqual,
  mapSettingsValidationErrors,
} from "@/renderer/features/settings/lib/settings-form";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type { AppSettings } from "@/shared/domain/settings";

export function useSettingsAutosave({
  clearSettingsFeedback,
  handleUpdateSettings,
  setSettingsSaveErrorMessage,
  setSettingsSavePhase,
  setSettingsValidationErrors,
  settingsDraft,
  settingsSavePhase,
}: {
  clearSettingsFeedback: ReturnType<
    typeof createAppActions
  >["clearSettingsFeedback"];
  handleUpdateSettings: ReturnType<
    typeof createAppActions
  >["handleUpdateSettings"];
  setSettingsSaveErrorMessage: ReturnType<
    typeof createAppActions
  >["setSettingsSaveErrorMessage"];
  setSettingsSavePhase: ReturnType<
    typeof createAppActions
  >["setSettingsSavePhase"];
  setSettingsValidationErrors: ReturnType<
    typeof createAppActions
  >["setSettingsValidationErrors"];
  settingsDraft: AppSettings | null;
  settingsSavePhase: AppControllerState["settingsSavePhase"];
}) {
  const lastSavedDraft = useRef<AppSettings | null>(null);
  const settingsSavePhaseRef = useRef(settingsSavePhase);

  useEffect(() => {
    settingsSavePhaseRef.current = settingsSavePhase;
  }, [settingsSavePhase]);

  useEffect(() => {
    const draft = settingsDraft;
    const currentSavePhase = settingsSavePhaseRef.current;
    if (!draft) {
      return;
    }

    if (lastSavedDraft.current === null) {
      lastSavedDraft.current = draft;
      return;
    }

    if (areAppSettingsEqual(draft, lastSavedDraft.current)) {
      if (currentSavePhase === "saved") {
        return;
      }

      if (currentSavePhase !== "idle") {
        clearSettingsFeedback();
      }
      return;
    }

    const validationResult = appSettingsSchema.safeParse(draft);
    if (!validationResult.success) {
      setSettingsValidationErrors(
        mapSettingsValidationErrors(validationResult.error.issues)
      );
      setSettingsSaveErrorMessage(null);
      setSettingsSavePhase("invalid");
      return;
    }

    setSettingsValidationErrors({});
    setSettingsSaveErrorMessage(null);
    if (currentSavePhase !== "pending") {
      setSettingsSavePhase("pending");
    }

    const timer = setTimeout(() => {
      void runAsyncTask(() => handleUpdateSettings(validationResult.data), {
        onError: () => {
          setSettingsSavePhase("error");
          setSettingsSaveErrorMessage(
            "Could not save settings. Your changes are still on screen."
          );
        },
        onStart: () => {
          setSettingsSavePhase("saving");
        },
        onSuccess: (savedSettings) => {
          lastSavedDraft.current = savedSettings;
          setSettingsSavePhase("saved");
          setSettingsSaveErrorMessage(null);
        },
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    clearSettingsFeedback,
    handleUpdateSettings,
    setSettingsSaveErrorMessage,
    setSettingsSavePhase,
    setSettingsValidationErrors,
    settingsDraft,
  ]);
}
