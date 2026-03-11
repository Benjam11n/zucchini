import type { Transition, Variants } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const microTransition: Transition = {
  duration: 0.18,
  ease: EASE_OUT,
};

export const staggerContainerVariants: Variants = {
  animate: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.06,
    },
  },
  exit: {},
  initial: {},
};

export const staggerItemVariants: Variants = {
  animate: {
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: EASE_OUT,
    },
    y: 0,
  },
  exit: {
    opacity: 0,
    transition: microTransition,
    y: -8,
  },
  initial: {
    opacity: 0,
    y: 10,
  },
};

export const hoverLift = {
  transition: microTransition,
  y: -2,
};

export const tapPress = {
  scale: 0.985,
  transition: {
    duration: 0.12,
    ease: EASE_OUT,
  },
};
