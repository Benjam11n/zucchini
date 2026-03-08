import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { BarChart3, CalendarDays, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MASCOTS } from "@/renderer/lib/mascots";
import { pageVariants } from "@/renderer/lib/motion";

import type { Tab } from "./types";

interface AppShellProps {
  children: ReactNode;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function AppShell({ children, tab, onTabChange }: AppShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-background text-foreground">
        <Tabs
          className="grid min-h-screen lg:grid-cols-[96px_1fr]"
          onValueChange={(value) => onTabChange(value as Tab)}
          value={tab}
        >
          <aside className="border-b border-border/70 bg-card px-4 py-4 lg:border-r lg:border-b-0 lg:px-3 lg:py-6">
            <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:gap-6">
              <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-1 lg:text-center">
                <img
                  alt="Zucchini logo"
                  className="size-12 object-contain"
                  src={MASCOTS.base}
                />
                <span className="text-sm font-black tracking-tight text-foreground">
                  Zucchini
                </span>
              </div>

              <TabsList className="hidden flex-col gap-2 rounded-none bg-transparent p-0 lg:flex">
                <TabsTrigger
                  aria-label="Today"
                  className="size-14 rounded-xl border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  value="today"
                >
                  <span className="sr-only">Today</span>
                  <CalendarDays className="size-5" />
                </TabsTrigger>
                <TabsTrigger
                  aria-label="History"
                  className="size-14 rounded-xl border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  value="history"
                >
                  <span className="sr-only">History</span>
                  <BarChart3 className="size-5" />
                </TabsTrigger>
                <TabsTrigger
                  aria-label="Settings"
                  className="size-14 rounded-xl border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  value="settings"
                >
                  <span className="sr-only">Settings</span>
                  <Settings2 className="size-5" />
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-1 items-center gap-3 lg:hidden">
                <TabsList className="grid flex-1 grid-cols-3 rounded-2xl bg-muted/80 p-1">
                  <TabsTrigger className="px-4" value="today">
                    Today
                  </TabsTrigger>
                  <TabsTrigger className="px-4" value="history">
                    History
                  </TabsTrigger>
                  <TabsTrigger className="px-4" value="settings">
                    Settings
                  </TabsTrigger>
                </TabsList>

                <Card>
                  <CardHeader className="px-0 py-0 text-right">
                    <CardTitle className="text-base font-black tracking-tight text-foreground">
                      Zucchini
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </aside>

          <section className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl overflow-hidden">
              <TabsContent className="mt-0" forceMount value={tab}>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={tab}
                    animate="animate"
                    exit="exit"
                    initial="initial"
                    variants={pageVariants}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            </div>
          </section>
        </Tabs>
      </main>
    </MotionConfig>
  );
}
