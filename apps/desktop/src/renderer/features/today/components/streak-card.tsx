import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  CalendarDays,
  Flame,
  Snowflake,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { memo, useMemo } from "react";

import type { TodayCelebration } from "@/renderer/features/today/lib/today-celebration";
import { MASCOTS } from "@/renderer/shared/assets/mascots";
import { HabitActivityCard } from "@/renderer/shared/components/activity-ring";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import { RING_COLORS } from "@/renderer/shared/lib/ring-colors";
import { Badge } from "@/renderer/shared/ui/badge";
import { Card, CardContent } from "@/renderer/shared/ui/card";
import type { HabitCategoryProgress } from "@/shared/domain/habit";
import { formatDateKey } from "@/shared/utils/date";

interface StreakCardProps {
  availableFreezes: number;
  celebration: TodayCelebration | null;
  categoryProgress: HabitCategoryProgress[];
  currentStreak: number;
  dateLabel: string;
  focusMinutes: number;
}

interface StatConfig {
  color: string | undefined;
  icon: React.ElementType;
  label: string;
  suffix?: string;
  value: number | string;
}

const CELEBRATION_CONFETTI = [
  { color: "var(--ring-fitness)", delay: 0.05, left: "8%", rotate: -18 },
  { color: "var(--ring-productivity)", delay: 0.12, left: "16%", rotate: 24 },
  { color: "var(--ring-nutrition)", delay: 0.18, left: "24%", rotate: -32 },
  { color: "var(--secondary)", delay: 0.02, left: "32%", rotate: 18 },
  { color: "var(--ring-fitness-glow)", delay: 0.14, left: "41%", rotate: -12 },
  {
    color: "var(--ring-productivity-glow)",
    delay: 0.08,
    left: "49%",
    rotate: 27,
  },
  {
    color: "var(--ring-nutrition-glow)",
    delay: 0.16,
    left: "57%",
    rotate: -24,
  },
  { color: "var(--secondary)", delay: 0.1, left: "66%", rotate: 14 },
  { color: "var(--ring-fitness)", delay: 0.2, left: "74%", rotate: -28 },
  { color: "var(--ring-productivity)", delay: 0.06, left: "82%", rotate: 20 },
  { color: "var(--ring-nutrition)", delay: 0.22, left: "90%", rotate: -16 },
] as const;

function StreakCardComponent({
  availableFreezes,
  celebration,
  categoryProgress,
  currentStreak,
  dateLabel,
  focusMinutes,
}: StreakCardProps) {
  const formattedDate = useMemo(
    () =>
      formatDateKey(dateLabel, {
        day: "numeric",
        month: "short",
        weekday: "short",
      }),
    [dateLabel]
  );

  const stats: StatConfig[] = useMemo(
    () => [
      {
        color: RING_COLORS.fitness.base,
        icon: Flame,
        label: "Streak",
        value: currentStreak,
      },
      {
        color: RING_COLORS.productivity.base,
        icon: Snowflake,
        label: "Freeze",
        value: availableFreezes,
      },
      {
        color: RING_COLORS.nutrition.base,
        icon: Timer,
        label: "Focus",
        suffix: "m",
        value: focusMinutes,
      },
      {
        color: undefined,
        icon: CalendarDays,
        label: "Date",
        value: formattedDate,
      },
    ],
    [availableFreezes, currentStreak, focusMinutes, formattedDate]
  );

  return (
    <LazyMotion features={domAnimation}>
      <Card className="relative isolate">
        <AnimatePresence>
          {celebration ? (
            <m.div
              key={celebration.id}
              animate={{ opacity: 1 }}
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,_var(--secondary)_24%,_transparent),_transparent_72%)]" />

              {CELEBRATION_CONFETTI.map((piece, index) => (
                <m.span
                  key={`${celebration.id}-${piece.left}`}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: [
                      0,
                      index % 2 === 0 ? -18 : 18,
                      index % 2 === 0 ? -34 : 34,
                    ],
                    y: [-12, 52, 128],
                  }}
                  className="absolute top-5 h-3 w-2 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  style={{
                    backgroundColor: piece.color,
                    left: piece.left,
                    rotate: `${piece.rotate}deg`,
                  }}
                  transition={{
                    delay: piece.delay,
                    duration: 1.8,
                    ease: "easeOut",
                    times: [0, 0.25, 1],
                  }}
                />
              ))}

              <m.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute inset-x-4 top-4"
                exit={{ opacity: 0, scale: 0.94, y: -8 }}
                initial={{ opacity: 0, scale: 0.92, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="mx-auto flex max-w-md items-center gap-3 rounded-3xl border border-white/60 bg-background/92 px-4 py-3 shadow-lg backdrop-blur">
                  <img
                    alt=""
                    className="size-14 shrink-0 rounded-2xl bg-accent/70 object-contain p-2"
                    src={MASCOTS.celebrate}
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-secondary text-secondary-foreground">
                        <Sparkles className="size-3" />
                        {celebration.title}
                      </Badge>
                      {celebration.isNewRecord ? (
                        <Badge variant="outline">
                          <Trophy className="size-3" />
                          New best
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {celebration.message}
                    </p>
                  </div>
                </div>
              </m.div>
            </m.div>
          ) : null}
        </AnimatePresence>

        <CardContent className="grid gap-6 p-6 lg:p-8">
          <div className="flex justify-center">
            <HabitActivityCard categoryProgress={categoryProgress} />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const c = stat.color;

              return (
                <m.div
                  key={stat.label}
                  whileHover={hoverLift}
                  whileTap={tapPress}
                >
                  <Card size="sm">
                    <CardContent className="flex items-center gap-3">
                      <span
                        className="rounded-full border p-2"
                        {...(c
                          ? {
                              style: {
                                backgroundColor: `color-mix(in srgb, ${c} 12%, transparent)`,
                                borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
                                color: c,
                              },
                            }
                          : {})}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="space-y-0.5">
                        <AnimatePresence initial={false} mode="popLayout">
                          <m.p
                            key={`${stat.label}-${stat.value}`}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-base leading-none font-semibold"
                            exit={{ opacity: 0, y: -8 }}
                            initial={{ opacity: 0, y: 8 }}
                            {...(c ? { style: { color: c } } : {})}
                            transition={microTransition}
                          >
                            {stat.value}
                            {stat.suffix}
                          </m.p>
                        </AnimatePresence>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </LazyMotion>
  );
}

export const StreakCard = memo(StreakCardComponent);
