import type * as FramerMotion from "framer-motion";
import { createElement, forwardRef } from "react";
import type { ComponentProps, ComponentPropsWithoutRef } from "react";

interface MotionMockProps extends ComponentPropsWithoutRef<"div"> {
  animate?: object;
  exit?: object;
  initial?: object;
  layout?: boolean | object | string;
  transition?: object;
  variants?: object;
  whileHover?: object;
  whileTap?: object;
}

export async function createFramerMotionMock(
  importOriginal: () => Promise<typeof FramerMotion>
) {
  const actual = await importOriginal();

  function createMotionProxy() {
    return new Proxy(
      {},
      {
        get: (_, tag: string) =>
          forwardRef<HTMLElement, MotionMockProps>(
            function MotionMock(props, ref) {
              const {
                animate: _animate,
                exit: _exit,
                initial: _initial,
                layout: _layout,
                transition: _transition,
                variants: _variants,
                whileHover: _whileHover,
                whileTap: _whileTap,
                ...rest
              } = props;

              return createElement(tag, { ...rest, ref });
            }
          ),
      }
    );
  }

  return {
    ...actual,
    LazyMotion: ({ children }: ComponentProps<typeof actual.LazyMotion>) =>
      createElement("div", null, children),
    m: createMotionProxy() as typeof actual.m,
  };
}
