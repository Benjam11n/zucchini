import { ArrowLeft, ArrowRight } from "lucide-react";

import { StarterPackEditor } from "@/renderer/features/starter-packs/components/starter-pack-editor";
import { StarterPackPicker } from "@/renderer/features/starter-packs/components/starter-pack-picker";
import { hasStarterPackHabits } from "@/renderer/features/starter-packs/lib/starter-pack-drafts";
import type {
  EditableStarterPackHabitDraft,
  StarterPackChoice,
} from "@/renderer/features/starter-packs/starter-packs.types";
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

import type {
  OnboardingReminderDraft,
  OnboardingStep,
  ReminderFieldErrors,
} from "../onboarding.types";
import { OnboardingReminderStep as OnboardingReminderFields } from "./onboarding-reminder-step";

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

export function OnboardingContentCard({
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
            <OnboardingReminderFields
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
