import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Leaf,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

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

import { OnboardingReminderStep } from "./onboarding-reminder-step";
import { StarterPackEditor } from "./starter-pack-editor";
import { StarterPackPicker } from "./starter-pack-picker";
import type {
  EditableStarterPackHabitDraft,
  OnboardingReminderDraft,
  OnboardingStarterChoice,
  ReminderFieldErrors,
} from "./types";
import {
  createReminderDraft,
  createStarterPackDrafts,
  hasStarterPackHabits,
  resolveOnboardingSettings,
  toStarterPackHabits,
} from "./utils";

type OnboardingStep = "edit" | "pick" | "reminders";

interface OnboardingTakeoverProps {
  baseSettings: AppSettings;
  error: HabitsIpcError | null;
  phase: "idle" | "submitting";
  onComplete: (input: CompleteOnboardingInput) => Promise<void>;
  onSkip: () => Promise<void>;
}

export function OnboardingTakeover({
  baseSettings,
  error,
  phase,
  onComplete,
  onSkip,
}: OnboardingTakeoverProps) {
  const [step, setStep] = useState<OnboardingStep>("pick");
  const [selectedChoice, setSelectedChoice] =
    useState<OnboardingStarterChoice | null>(null);
  const [habitDrafts, setHabitDrafts] = useState(
    [] as EditableStarterPackHabitDraft[]
  );
  const [reminderDraft, setReminderDraft] = useState<OnboardingReminderDraft>(
    () => createReminderDraft(baseSettings)
  );
  const [fieldErrors, setFieldErrors] = useState<ReminderFieldErrors>({});
  const [permissionMessage, setPermissionMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    setReminderDraft(createReminderDraft(baseSettings));
  }, [baseSettings]);

  useEffect(() => {
    if (
      reminderDraft.reminderEnabled &&
      typeof Notification !== "undefined" &&
      Notification.permission === "denied"
    ) {
      setPermissionMessage(
        "Notifications are blocked by the OS or browser. Zucchini will still save your reminder settings."
      );
      return;
    }

    setPermissionMessage(null);
  }, [reminderDraft.reminderEnabled]);

  const isSubmitting = phase === "submitting";
  let stepLabel = "Step 3";
  let stepTitle = "Lock in your reminder";

  if (step === "pick") {
    stepLabel = "Step 1";
    stepTitle = "Choose how you want to start";
  } else if (step === "edit") {
    stepLabel = "Step 2";
    stepTitle = "Edit this starter pack";
  }

  async function requestNotificationPermission(): Promise<void> {
    if (
      !reminderDraft.reminderEnabled ||
      typeof Notification === "undefined" ||
      Notification.permission !== "default"
    ) {
      if (
        reminderDraft.reminderEnabled &&
        typeof Notification !== "undefined" &&
        Notification.permission === "denied"
      ) {
        setPermissionMessage(
          "Notifications are blocked by the OS or browser. Zucchini will still save your reminder settings."
        );
      }
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "denied") {
      setPermissionMessage(
        "Notifications are blocked by the OS or browser. Zucchini will still save your reminder settings."
      );
    } else {
      setPermissionMessage(null);
    }
  }

  function handleContinueFromPicker(): void {
    if (!selectedChoice) {
      return;
    }

    if (selectedChoice === "blank") {
      setHabitDrafts([]);
      setStep("reminders");
      return;
    }

    setHabitDrafts(createStarterPackDrafts(selectedChoice));
    setStep("edit");
  }

  async function handleFinish(): Promise<void> {
    const resolvedSettings = resolveOnboardingSettings(
      baseSettings,
      reminderDraft
    );
    setFieldErrors(resolvedSettings.fieldErrors);

    if (!resolvedSettings.settings) {
      return;
    }

    const {settings} = resolvedSettings;

    await requestNotificationPermission();
    await runAsyncTask(
      () =>
        onComplete({
          habits:
            selectedChoice === "blank" ? [] : toStarterPackHabits(habitDrafts),
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
              <span
                className={step === "reminders" ? "text-primary" : undefined}
              >
                Reminders
              </span>
            </div>
          </CardContent>
        </Card>

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
                  onSelectChoice={setSelectedChoice}
                  selectedChoice={selectedChoice}
                  showBlankOption={true}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    disabled={isSubmitting}
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      void handleSkip();
                    }}
                  >
                    Skip for now
                  </Button>
                  <Button
                    disabled={!selectedChoice || isSubmitting}
                    type="button"
                    onClick={handleContinueFromPicker}
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
                  onChange={setHabitDrafts}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("pick")}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                  <Button
                    disabled={!hasStarterPackHabits(habitDrafts)}
                    type="button"
                    onClick={() => setStep("reminders")}
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
                  onChange={setReminderDraft}
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
                      setStep(selectedChoice === "blank" ? "pick" : "edit")
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
                    onClick={() => {
                      void handleFinish();
                    }}
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
      </div>
    </main>
  );
}
