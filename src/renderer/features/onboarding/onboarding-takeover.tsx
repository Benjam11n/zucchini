/**
 * Full-screen first-run onboarding flow.
 *
 * New users land here to choose a starter pack, edit the generated habits, and
 * save reminder settings before entering the main app.
 */
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Leaf,
  Sparkles,
} from "lucide-react";
import { useEffect, useReducer } from "react";

import { StarterPackEditor } from "@/renderer/features/starter-packs/components/starter-pack-editor";
import { StarterPackPicker } from "@/renderer/features/starter-packs/components/starter-pack-picker";
import {
  createStarterPackDrafts,
  hasStarterPackHabits,
  toStarterPackHabits,
} from "@/renderer/features/starter-packs/lib/starter-pack-drafts";
import type {
  EditableStarterPackHabitDraft,
  StarterPackChoice,
} from "@/renderer/features/starter-packs/starter-packs.types";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import { Spinner } from "@/renderer/shared/ui/spinner";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { CompleteOnboardingInput } from "@/shared/domain/onboarding";
import type { AppSettings } from "@/shared/domain/settings";

import { OnboardingReminderStep } from "./components/onboarding-reminder-step";
import {
  createReminderDraft,
  resolveOnboardingSettings,
} from "./lib/onboarding-settings";
import type {
  OnboardingReminderDraft,
  ReminderFieldErrors,
} from "./onboarding.types";

type OnboardingStep = "edit" | "pick" | "reminders";
const NOTIFICATION_BLOCKED_MESSAGE =
  "Notifications are blocked by the OS or browser. Zucchini will still save your reminder settings.";

interface OnboardingTakeoverProps {
  baseSettings: AppSettings;
  error: HabitsIpcError | null;
  phase: "idle" | "submitting";
  onComplete: (input: CompleteOnboardingInput) => Promise<void>;
  onSkip: () => Promise<void>;
}

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
  }
}

function OnboardingIntroCard({ step }: { step: OnboardingStep }) {
  return (
    <Card className="border border-border/70 bg-card/90 py-0">
      <CardContent className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
        <div className="grid gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
            <Leaf className="size-3.5 text-primary" />
            First-week setup
          </div>

          <div className="grid gap-3">
            <h1 className="max-w-md text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Start with a system, not an empty page.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pick a starter pack, make it yours, and set one reminder that
              helps the first week stick.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              {
                icon: Compass,
                text: "Choose a pack or start blank.",
              },
              {
                icon: Sparkles,
                text: "Edit the habits before they land in Today.",
              },
              {
                icon: CheckCircle2,
                text: "Finish with reminder timing that matches your week.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/75 px-4 py-3"
                >
                  <span className="rounded-full bg-primary/12 p-2 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-muted-foreground">
          <span className={step === "pick" ? "text-primary" : undefined}>
            Pick
          </span>
          <span className="opacity-35">/</span>
          <span className={step === "edit" ? "text-primary" : undefined}>
            Edit
          </span>
          <span className="opacity-35">/</span>
          <span className={step === "reminders" ? "text-primary" : undefined}>
            Reminders
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface OnboardingContentCardProps {
  error: HabitsIpcError | null;
  fieldErrors: ReminderFieldErrors;
  habitDrafts: EditableStarterPackHabitDraft[];
  isSubmitting: boolean;
  onContinueFromPicker: () => void;
  onFinish: () => void;
  onHabitDraftsChange: (habitDrafts: EditableStarterPackHabitDraft[]) => void;
  onReminderDraftChange: (reminderDraft: OnboardingReminderDraft) => void;
  onSelectChoice: (selectedChoice: StarterPackChoice | null) => void;
  onSkip: () => void;
  onStepChange: (step: OnboardingStep) => void;
  permissionMessage: string | null;
  reminderDraft: OnboardingReminderDraft;
  selectedChoice: StarterPackChoice | null;
  step: OnboardingStep;
  stepLabel: string;
  stepTitle: string;
}

function OnboardingContentCard({
  error,
  fieldErrors,
  habitDrafts,
  isSubmitting,
  onContinueFromPicker,
  onFinish,
  onHabitDraftsChange,
  onReminderDraftChange,
  onSelectChoice,
  onSkip,
  onStepChange,
  permissionMessage,
  reminderDraft,
  selectedChoice,
  step,
  stepLabel,
  stepTitle,
}: OnboardingContentCardProps) {
  return (
    <Card className="border border-border/70 bg-card/95 py-0">
      <CardHeader className="gap-3 border-b border-border/60 pb-5">
        <CardDescription>{stepLabel}</CardDescription>
        <CardTitle className="text-2xl font-black tracking-tight">
          {stepTitle}
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-5 p-6 sm:p-8">
        {step === "pick" ? (
          <>
            <StarterPackPicker
              onSelectChoice={onSelectChoice}
              selectedChoice={selectedChoice}
              showBlankOption={true}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                disabled={isSubmitting}
                type="button"
                variant="ghost"
                onClick={onSkip}
              >
                Skip for now
              </Button>
              <Button
                disabled={!selectedChoice || isSubmitting}
                type="button"
                onClick={onContinueFromPicker}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        ) : null}

        {step === "edit" ? (
          <>
            <StarterPackEditor
              drafts={habitDrafts}
              onChange={onHabitDraftsChange}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onStepChange("pick")}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                disabled={!hasStarterPackHabits(habitDrafts)}
                type="button"
                onClick={() => onStepChange("reminders")}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        ) : null}

        {step === "reminders" ? (
          <>
            <OnboardingReminderStep
              fieldErrors={fieldErrors}
              onChange={onReminderDraftChange}
              reminderDraft={reminderDraft}
            />

            {permissionMessage ? (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                {permissionMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  onStepChange(selectedChoice === "blank" ? "pick" : "edit")
                }
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                disabled={
                  isSubmitting ||
                  (selectedChoice !== "blank" &&
                    !hasStarterPackHabits(habitDrafts))
                }
                type="button"
                onClick={onFinish}
              >
                {isSubmitting ? <Spinner className="size-4" /> : null}
                {selectedChoice === "blank"
                  ? "Start blank"
                  : "Create starter pack"}
              </Button>
            </div>
          </>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OnboardingTakeover({
  baseSettings,
  error,
  phase,
  onComplete,
  onSkip,
}: OnboardingTakeoverProps) {
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

  const isSubmitting = phase === "submitting";
  let stepLabel = "Step 3";
  let stepTitle = "Lock in your reminder";

  if (viewState.step === "pick") {
    stepLabel = "Step 1";
    stepTitle = "Choose how you want to start";
  } else if (viewState.step === "edit") {
    stepLabel = "Step 2";
    stepTitle = "Edit this starter pack";
  }

  async function requestNotificationPermission(): Promise<void> {
    if (
      !viewState.reminderDraft.reminderEnabled ||
      typeof Notification === "undefined" ||
      Notification.permission !== "default"
    ) {
      if (
        viewState.reminderDraft.reminderEnabled &&
        typeof Notification !== "undefined" &&
        Notification.permission === "denied"
      ) {
        dispatch({
          permissionMessage: NOTIFICATION_BLOCKED_MESSAGE,
          type: "setPermissionMessage",
        });
      }
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "denied") {
      dispatch({
        permissionMessage: NOTIFICATION_BLOCKED_MESSAGE,
        type: "setPermissionMessage",
      });
    } else {
      dispatch({
        permissionMessage: null,
        type: "setPermissionMessage",
      });
    }
  }

  function handleContinueFromPicker(): void {
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
  }

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

    await requestNotificationPermission();
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(115,169,83,0.18),_transparent_35%),linear-gradient(180deg,_var(--background),_color-mix(in_srgb,_var(--background)_92%,_#dbe7cf))] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <OnboardingIntroCard step={viewState.step} />
        <OnboardingContentCard
          error={error}
          fieldErrors={viewState.fieldErrors}
          habitDrafts={viewState.habitDrafts}
          isSubmitting={isSubmitting}
          onContinueFromPicker={handleContinueFromPicker}
          onFinish={() => {
            void handleFinish();
          }}
          onHabitDraftsChange={(habitDrafts) => {
            dispatch({ habitDrafts, type: "setHabitDrafts" });
          }}
          onReminderDraftChange={(reminderDraft) => {
            dispatch({ reminderDraft, type: "setReminderDraft" });
          }}
          onSelectChoice={(selectedChoice) => {
            dispatch({ selectedChoice, type: "setSelectedChoice" });
          }}
          onSkip={() => {
            void handleSkip();
          }}
          onStepChange={(step) => {
            dispatch({ step, type: "setStep" });
          }}
          permissionMessage={viewState.permissionMessage}
          reminderDraft={viewState.reminderDraft}
          selectedChoice={viewState.selectedChoice}
          step={viewState.step}
          stepLabel={stepLabel}
          stepTitle={stepTitle}
        />
      </div>
    </main>
  );
}
