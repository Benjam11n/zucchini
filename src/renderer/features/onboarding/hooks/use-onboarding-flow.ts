import { useEffect, useReducer } from "react";

import {
  createStarterPackDrafts,
  toStarterPackHabits,
} from "@/renderer/features/starter-packs/lib/starter-pack-drafts";
import type {
  EditableStarterPackHabitDraft,
  StarterPackChoice,
} from "@/renderer/features/starter-packs/starter-packs.types";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import type { CompleteOnboardingInput } from "@/shared/domain/onboarding";
import type { AppSettings } from "@/shared/domain/settings";

import {
  createReminderDraft,
  resolveOnboardingSettings,
} from "../lib/onboarding-settings";
import type {
  OnboardingReminderDraft,
  OnboardingStep,
  ReminderFieldErrors,
} from "../onboarding.types";

const NOTIFICATION_BLOCKED_MESSAGE =
  "Notifications are blocked by the OS or browser. Zucchini will still save your reminder settings.";

interface OnboardingViewState {
  fieldErrors: ReminderFieldErrors;
  habitDrafts: EditableStarterPackHabitDraft[];
  permissionMessage: string | null;
  reminderDraft: OnboardingReminderDraft;
  selectedChoice: StarterPackChoice | null;
  step: OnboardingStep;
}

type OnboardingViewAction =
  | { fieldErrors: ReminderFieldErrors; type: "setFieldErrors" }
  | { habitDrafts: EditableStarterPackHabitDraft[]; type: "setHabitDrafts" }
  | { permissionMessage: string | null; type: "setPermissionMessage" }
  | { reminderDraft: OnboardingReminderDraft; type: "setReminderDraft" }
  | { selectedChoice: StarterPackChoice | null; type: "setSelectedChoice" }
  | { step: OnboardingStep; type: "setStep" };

function createOnboardingViewState(
  baseSettings: AppSettings
): OnboardingViewState {
  return {
    fieldErrors: {},
    habitDrafts: [],
    permissionMessage: null,
    reminderDraft: createReminderDraft(baseSettings),
    selectedChoice: null,
    step: "pick",
  };
}

function onboardingViewReducer(
  state: OnboardingViewState,
  action: OnboardingViewAction
): OnboardingViewState {
  switch (action.type) {
    case "setFieldErrors": {
      return { ...state, fieldErrors: action.fieldErrors };
    }
    case "setHabitDrafts": {
      return { ...state, habitDrafts: action.habitDrafts };
    }
    case "setPermissionMessage": {
      return { ...state, permissionMessage: action.permissionMessage };
    }
    case "setReminderDraft": {
      return { ...state, reminderDraft: action.reminderDraft };
    }
    case "setSelectedChoice": {
      return { ...state, selectedChoice: action.selectedChoice };
    }
    case "setStep": {
      return { ...state, step: action.step };
    }
    default: {
      return state;
    }
  }
}

function requestNotificationPermission(
  reminderDraft: OnboardingReminderDraft
): Promise<NotificationPermission | null> {
  if (
    !reminderDraft.reminderEnabled ||
    typeof Notification === "undefined" ||
    Notification.permission !== "default"
  ) {
    return Promise.resolve(
      typeof Notification === "undefined" ? null : Notification.permission
    );
  }

  return Notification.requestPermission();
}

interface UseOnboardingFlowOptions {
  baseSettings: AppSettings;
  onComplete: (input: CompleteOnboardingInput) => Promise<void>;
  onSkip: () => Promise<void>;
}

export function useOnboardingFlow({
  baseSettings,
  onComplete,
  onSkip,
}: UseOnboardingFlowOptions) {
  const [viewState, dispatch] = useReducer(
    onboardingViewReducer,
    baseSettings,
    createOnboardingViewState
  );

  useEffect(() => {
    dispatch({
      reminderDraft: createReminderDraft(baseSettings),
      type: "setReminderDraft",
    });
  }, [baseSettings]);

  useEffect(() => {
    if (
      viewState.reminderDraft.reminderEnabled &&
      typeof Notification !== "undefined" &&
      Notification.permission === "denied"
    ) {
      dispatch({
        permissionMessage: NOTIFICATION_BLOCKED_MESSAGE,
        type: "setPermissionMessage",
      });
      return;
    }

    dispatch({
      permissionMessage: null,
      type: "setPermissionMessage",
    });
  }, [viewState.reminderDraft.reminderEnabled]);

  async function handleFinish(): Promise<void> {
    const resolvedSettings = resolveOnboardingSettings(
      baseSettings,
      viewState.reminderDraft
    );
    dispatch({
      fieldErrors: resolvedSettings.fieldErrors,
      type: "setFieldErrors",
    });

    if (!resolvedSettings.settings) {
      return;
    }
    const { settings } = resolvedSettings;

    const permission = await requestNotificationPermission(
      viewState.reminderDraft
    );
    dispatch({
      permissionMessage:
        permission === "denied" ? NOTIFICATION_BLOCKED_MESSAGE : null,
      type: "setPermissionMessage",
    });

    await runAsyncTask(
      () =>
        onComplete({
          habits:
            viewState.selectedChoice === "blank"
              ? []
              : toStarterPackHabits(viewState.habitDrafts),
          settings,
        }),
      {
        onError: () => {
          // Store state already captures the error for inline display.
        },
      }
    );
  }

  async function handleSkip(): Promise<void> {
    await runAsyncTask(() => onSkip(), {
      onError: () => {
        // Store state already captures the error for inline display.
      },
    });
  }

  return {
    actions: {
      handleChoiceChange(selectedChoice: StarterPackChoice | null): void {
        dispatch({ selectedChoice, type: "setSelectedChoice" });
      },
      handleContinueFromPicker(): void {
        if (!viewState.selectedChoice) {
          return;
        }

        if (viewState.selectedChoice === "blank") {
          dispatch({ habitDrafts: [], type: "setHabitDrafts" });
          dispatch({ step: "reminders", type: "setStep" });
          return;
        }

        dispatch({
          habitDrafts: createStarterPackDrafts(viewState.selectedChoice),
          type: "setHabitDrafts",
        });
        dispatch({ step: "edit", type: "setStep" });
      },
      handleFinish,
      handleHabitDraftsChange(
        habitDrafts: EditableStarterPackHabitDraft[]
      ): void {
        dispatch({ habitDrafts, type: "setHabitDrafts" });
      },
      handleReminderDraftChange(reminderDraft: OnboardingReminderDraft): void {
        dispatch({ reminderDraft, type: "setReminderDraft" });
      },
      async handleSkip(): Promise<void> {
        await handleSkip();
      },
      handleStepChange(step: OnboardingStep): void {
        dispatch({ step, type: "setStep" });
      },
    },
    viewState,
  };
}
