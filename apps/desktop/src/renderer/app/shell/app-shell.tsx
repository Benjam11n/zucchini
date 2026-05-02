/**
 * Shared renderer shell for the main desktop experience.
 *
 * It renders the tab navigation, mobile/desktop chrome, page transition
 * animations, and global UI such as the update button.
 */
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "framer-motion";
import type { ReactNode } from "react";

import type { AppTab } from "@/renderer/app/app.types";
import { AppNav } from "@/renderer/app/shell/app-nav";
import { UpdateButton } from "@/renderer/app/shell/update-button";
import { Tabs, TabsContent } from "@/renderer/shared/components/ui/tabs";
import { pageVariants } from "@/renderer/shared/lib/motion";

interface AppShellProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  tab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function AppShell({
  children,
  rightSidebar,
  tab,
  onTabChange,
}: AppShellProps) {
  const contentGridClassName = rightSidebar
    ? "lg:grid-cols-[72px_minmax(0,1fr)_280px] xl:grid-cols-[96px_minmax(0,1fr)_340px]"
    : "lg:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[96px_minmax(0,1fr)]";

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <main className="min-h-screen bg-background text-foreground">
          <UpdateButton />
          <div
            className={`grid min-h-screen w-full max-w-full grid-rows-[auto_1fr] lg:grid-rows-1 ${contentGridClassName}`}
          >
            <Tabs
              className="contents"
              onValueChange={(value) => onTabChange(value as AppTab)}
              value={tab}
            >
              <AppNav />

              <section className="min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-6 lg:px-4 lg:py-8 xl:px-8">
                <div className="mx-auto min-w-0 w-full max-w-2xl xl:max-w-3xl">
                  <TabsContent className="mt-0 min-w-0" forceMount value={tab}>
                    <AnimatePresence initial={false} mode="wait">
                      <m.div
                        key={tab}
                        animate="animate"
                        className="min-w-0"
                        exit="exit"
                        initial="initial"
                        variants={pageVariants}
                      >
                        {children}
                      </m.div>
                    </AnimatePresence>
                  </TabsContent>
                </div>
              </section>
              {rightSidebar ? (
                <aside className="hidden min-w-0 border-l border-border/70 bg-card px-4 py-8 lg:block xl:px-5">
                  <div className="sticky top-8">{rightSidebar}</div>
                </aside>
              ) : null}
            </Tabs>
          </div>
        </main>
      </LazyMotion>
    </MotionConfig>
  );
}
