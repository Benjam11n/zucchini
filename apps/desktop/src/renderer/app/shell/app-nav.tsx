import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  LineChart,
  MoonStar,
  Settings2,
  Timer,
} from "lucide-react";

import { FeaturesCarouselDialog } from "@/renderer/app/shell/feature-highlights-dialog";
import { MASCOTS } from "@/renderer/assets/mascots";
import { Button } from "@/renderer/shared/components/ui/button";
import { TabsList, TabsTrigger } from "@/renderer/shared/components/ui/tabs";

export function AppNav() {
  return (
    <aside className="flex border-b border-border/70 bg-card px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:px-2 lg:py-6 xl:px-3">
      <div className="flex w-full items-center gap-3 lg:w-auto lg:flex-col lg:items-center lg:gap-6">
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-1 lg:text-center">
          <img
            alt="Zucchini logo"
            className="size-12 rounded object-contain"
            src={MASCOTS.icon}
          />
          <span className="text-sm font-black tracking-tight text-foreground">
            Zucchini
          </span>
        </div>

        <TabsList className="hidden flex-col gap-2 rounded-none bg-transparent p-0 lg:flex">
          <TabsTrigger
            aria-label="Today"
            className="size-14 border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            value="today"
          >
            <span className="sr-only">Today</span>
            <CalendarDays className="size-5" />
          </TabsTrigger>
          <TabsTrigger
            aria-label="Focus"
            className="size-14 border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            value="focus"
          >
            <span className="sr-only">Focus</span>
            <Timer className="size-5" />
          </TabsTrigger>
          <TabsTrigger
            aria-label="Wind Down"
            className="size-14 border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            value="windDown"
          >
            <span className="sr-only">Wind Down</span>
            <MoonStar className="size-5" />
          </TabsTrigger>
          <TabsTrigger
            aria-label="Insights"
            className="size-14 border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            value="insights"
          >
            <span className="sr-only">Insights</span>
            <LineChart className="size-5" />
          </TabsTrigger>
          <TabsTrigger
            aria-label="History"
            className="size-14 border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            value="history"
          >
            <span className="sr-only">History</span>
            <BarChart3 className="size-5" />
          </TabsTrigger>
          <TabsTrigger
            aria-label="Settings"
            className="size-14 border-border/70 bg-transparent p-0 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            value="settings"
          >
            <span className="sr-only">Settings</span>
            <Settings2 className="size-5" />
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-1 justify-center lg:hidden">
          <TabsList className="grid w-full max-w-5xl grid-cols-6 bg-muted/80 p-1">
            <TabsTrigger className="px-4" value="today">
              <CalendarDays className="size-4" />
              Today
            </TabsTrigger>
            <TabsTrigger className="px-4" value="focus">
              <Timer className="size-4" />
              Focus
            </TabsTrigger>
            <TabsTrigger className="px-4" value="windDown">
              <MoonStar className="size-4" />
              Wind Down
            </TabsTrigger>
            <TabsTrigger className="px-4" value="insights">
              <LineChart className="size-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger className="px-4" value="history">
              <BarChart3 className="size-4" />
              History
            </TabsTrigger>
            <TabsTrigger className="px-4" value="settings">
              <Settings2 className="size-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="mt-auto hidden justify-center pt-6 lg:flex">
        <FeaturesCarouselDialog
          trigger={
            <Button
              aria-label="Open feature highlights"
              className="size-10 rounded-full border-border/70 bg-transparent text-muted-foreground hover:text-foreground"
              size="icon"
              type="button"
              variant="outline"
            >
              <CircleHelp className="size-5" />
            </Button>
          }
        />
      </div>
    </aside>
  );
}
