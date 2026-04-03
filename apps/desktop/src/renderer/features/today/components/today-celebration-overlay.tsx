import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { memo } from "react";

import { MASCOTS } from "@/renderer/assets/mascots";
import type { TodayCelebration } from "@/renderer/features/today/lib/today-celebration";

interface TodayCelebrationOverlayProps {
  celebration: TodayCelebration | null;
}

const CONFETTI_PIECES = [
  {
    color: "var(--ring-fitness)",
    id: "c1",
    rotate: -26,
    spreadX: -220,
    spreadY: -320,
  },
  {
    color: "var(--secondary)",
    id: "c2",
    rotate: -12,
    spreadX: -180,
    spreadY: -360,
  },
  {
    color: "var(--ring-productivity)",
    id: "c3",
    rotate: 8,
    spreadX: -150,
    spreadY: -400,
  },
  {
    color: "var(--ring-nutrition)",
    id: "c4",
    rotate: 18,
    spreadX: -120,
    spreadY: -345,
  },
  {
    color: "var(--ring-fitness-glow)",
    id: "c5",
    rotate: -34,
    spreadX: -95,
    spreadY: -425,
  },
  {
    color: "var(--ring-productivity-glow)",
    id: "c6",
    rotate: 24,
    spreadX: -70,
    spreadY: -380,
  },
  {
    color: "var(--ring-nutrition-glow)",
    id: "c7",
    rotate: -18,
    spreadX: -40,
    spreadY: -450,
  },
  {
    color: "var(--secondary)",
    id: "c8",
    rotate: 12,
    spreadX: 0,
    spreadY: -410,
  },
  {
    color: "var(--ring-fitness)",
    id: "c9",
    rotate: -10,
    spreadX: 42,
    spreadY: -445,
  },
  {
    color: "var(--ring-productivity)",
    id: "c10",
    rotate: 30,
    spreadX: 70,
    spreadY: -375,
  },
  {
    color: "var(--ring-nutrition)",
    id: "c11",
    rotate: -22,
    spreadX: 98,
    spreadY: -430,
  },
  {
    color: "var(--secondary)",
    id: "c12",
    rotate: 16,
    spreadX: 124,
    spreadY: -350,
  },
  {
    color: "var(--ring-fitness-glow)",
    id: "c13",
    rotate: -28,
    spreadX: 155,
    spreadY: -405,
  },
  {
    color: "var(--ring-productivity-glow)",
    id: "c14",
    rotate: 22,
    spreadX: 188,
    spreadY: -360,
  },
  {
    color: "var(--ring-nutrition-glow)",
    id: "c15",
    rotate: -16,
    spreadX: 225,
    spreadY: -320,
  },
  {
    color: "var(--secondary)",
    id: "c16",
    rotate: 34,
    spreadX: 255,
    spreadY: -290,
  },
  {
    color: "var(--ring-fitness)",
    id: "c17",
    rotate: -20,
    spreadX: -250,
    spreadY: -250,
  },
  {
    color: "var(--ring-productivity)",
    id: "c18",
    rotate: 20,
    spreadX: -205,
    spreadY: -285,
  },
  {
    color: "var(--ring-nutrition)",
    id: "c19",
    rotate: -8,
    spreadX: -160,
    spreadY: -255,
  },
  {
    color: "var(--secondary)",
    id: "c20",
    rotate: 26,
    spreadX: -112,
    spreadY: -295,
  },
  {
    color: "var(--ring-fitness-glow)",
    id: "c21",
    rotate: -30,
    spreadX: -58,
    spreadY: -270,
  },
  {
    color: "var(--ring-productivity-glow)",
    id: "c22",
    rotate: 10,
    spreadX: 54,
    spreadY: -275,
  },
  {
    color: "var(--ring-nutrition-glow)",
    id: "c23",
    rotate: -14,
    spreadX: 110,
    spreadY: -310,
  },
  {
    color: "var(--secondary)",
    id: "c24",
    rotate: 30,
    spreadX: 165,
    spreadY: -260,
  },
  {
    color: "var(--ring-fitness)",
    id: "c25",
    rotate: -18,
    spreadX: 214,
    spreadY: -300,
  },
  {
    color: "var(--ring-productivity)",
    id: "c26",
    rotate: 14,
    spreadX: 268,
    spreadY: -245,
  },
  {
    color: "var(--ring-nutrition)",
    id: "c27",
    rotate: -24,
    spreadX: -18,
    spreadY: -500,
  },
  {
    color: "var(--secondary)",
    id: "c28",
    rotate: 18,
    spreadX: 18,
    spreadY: -470,
  },
] as const;

function TodayCelebrationOverlayComponent({
  celebration,
}: TodayCelebrationOverlayProps) {
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {celebration ? (
          <m.div
            key={celebration.id}
            animate={{ opacity: 1 }}
            className="pointer-events-none fixed inset-0 z-50"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
              {CONFETTI_PIECES.map((piece, index) => (
                <m.span
                  key={`${celebration.id}-${piece.id}`}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    rotate: [
                      piece.rotate,
                      piece.rotate + (index % 2 === 0 ? 48 : -48),
                      piece.rotate + (index % 2 === 0 ? 96 : -96),
                    ],
                    x: [0, piece.spreadX * 0.55, piece.spreadX],
                    y: [0, piece.spreadY * 0.6, piece.spreadY],
                  }}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  initial={{ opacity: 0, scale: 0.55, x: "-50%", y: "-50%" }}
                  style={{
                    backgroundColor: piece.color,
                    height: index % 3 === 0 ? "1rem" : "0.72rem",
                    marginLeft: index % 2 === 0 ? "-0.2rem" : "-0.14rem",
                    marginTop: "-0.25rem",
                    width: index % 2 === 0 ? "0.38rem" : "0.24rem",
                  }}
                  transition={{
                    delay: index * 0.012,
                    duration: 1.45,
                    ease: [0.16, 1, 0.3, 1],
                    times: [0, 0.45, 1],
                  }}
                />
              ))}

              <m.img
                alt="Celebrating Zucchini mascot"
                animate={{
                  opacity: [0, 1, 1],
                  rotate: [-8, 3, 0],
                  scale: [0.72, 1.08, 1],
                  y: [20, -10, 0],
                }}
                className="relative z-10 size-28 object-contain drop-shadow-[0_18px_40px_color-mix(in_srgb,var(--foreground)_12%,transparent)] sm:size-32"
                exit={{
                  opacity: [1, 1, 0],
                  rotate: [0, -4, 6],
                  scale: [1, 0.94, 0.76],
                  y: [0, -6, 18],
                }}
                initial={{ opacity: 0, scale: 0.68, y: 24 }}
                src={MASCOTS.celebrate}
                transition={{
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.65, 1],
                }}
              />
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  );
}

export const TodayCelebrationOverlay = memo(TodayCelebrationOverlayComponent);
