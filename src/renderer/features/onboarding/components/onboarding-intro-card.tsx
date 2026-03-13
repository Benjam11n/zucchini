import { CheckCircle2, Compass, Leaf, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/renderer/shared/ui/card";

import type { OnboardingStep } from "../onboarding.types";

export function OnboardingIntroCard({ step }: { step: OnboardingStep }) {
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
