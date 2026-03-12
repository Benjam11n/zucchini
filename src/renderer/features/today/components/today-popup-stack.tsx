import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";

import type { PopupEvent } from "@/renderer/features/today/today.types";

interface TodayPopupStackProps {
  popups: PopupEvent[];
}

export function TodayPopupStack({ popups }: TodayPopupStackProps) {
  return (
    <LazyMotion features={domAnimation}>
      <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {popups.map((popup) => (
            <m.div
              key={popup.id}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="pointer-events-auto flex w-88 items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-lg"
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
            >
              <img
                alt="Mascot"
                className="size-16 shrink-0 object-contain drop-shadow-sm"
                src={popup.mascot}
              />
              <div className="grid gap-1">
                <h4 className="text-sm font-bold text-foreground">
                  {popup.title}
                </h4>
                <p className="text-xs text-muted-foreground">{popup.message}</p>
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
