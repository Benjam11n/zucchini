/**
 * Full-screen first-run onboarding flow.
 *
 * New users land here to choose a starter pack, edit the generated habits, and
 * save reminder settings before entering the main app.
 */
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { CompleteOnboardingInput } from "@/shared/domain/onboarding";
import type { AppSettings } from "@/shared/domain/settings";

import { OnboardingContentCard } from "./components/onboarding-content-card";
import { OnboardingIntroCard } from "./components/onboarding-intro-card";
import { useOnboardingFlow } from "./hooks/use-onboarding-flow";

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
  const { actions, viewState } = useOnboardingFlow({
    baseSettings,
    onComplete,
    onSkip,
  });

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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(115,169,83,0.18),_transparent_35%),linear-gradient(180deg,_var(--background),_color-mix(in_srgb,_var(--background)_92%,_#dbe7cf))] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <OnboardingIntroCard step={viewState.step} />
        <OnboardingContentCard
          error={error}
          fieldErrors={viewState.fieldErrors}
          habitDrafts={viewState.habitDrafts}
          isSubmitting={isSubmitting}
          onContinueFromPicker={actions.handleContinueFromPicker}
          onFinish={() => {
            void actions.handleFinish();
          }}
          onHabitDraftsChange={actions.handleHabitDraftsChange}
          onReminderDraftChange={actions.handleReminderDraftChange}
          onSelectChoice={actions.handleChoiceChange}
          onSkip={() => {
            void actions.handleSkip();
          }}
          onStepChange={actions.handleStepChange}
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
