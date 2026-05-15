import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/renderer/shared/components/ui/dropdown-menu";
import { TabsList, TabsTrigger } from "@/renderer/shared/components/ui/tabs";
import { formatDate } from "@/shared/utils/date";

export type HistoryViewMode = "review" | "timeline";

interface HistoryPageHeaderProps {
  availableYears: number[];
  canShowNextMonth: boolean;
  canShowPreviousMonth: boolean;
  historyMode: HistoryViewMode;
  selectedYear: number;
  visibleMonth: Date;
  onSelectYear: (year: number) => void;
  onShowMonth: (offset: number) => void;
}

export function HistoryPageHeader({
  availableYears,
  canShowNextMonth,
  canShowPreviousMonth,
  historyMode,
  selectedYear,
  visibleMonth,
  onSelectYear,
  onShowMonth,
}: HistoryPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          History
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TabsList className="rounded-lg">
          <TabsTrigger className="h-7 px-3 text-xs" value="timeline">
            Timeline
          </TabsTrigger>
          <TabsTrigger className="h-7 px-3 text-xs" value="review">
            Review
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {historyMode === "timeline" ? (
          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background/45 px-1">
            <Button
              aria-label="Show previous month"
              disabled={!canShowPreviousMonth}
              onClick={() => onShowMonth(-1)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-20 text-center text-sm font-medium text-muted-foreground">
              {formatDate(visibleMonth, { month: "long" })}
            </span>
            <Button
              aria-label="Show next month"
              disabled={!canShowNextMonth}
              onClick={() => onShowMonth(1)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" type="button" variant="outline">
              {selectedYear}
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableYears.map((year) => (
              <DropdownMenuItem key={year} onClick={() => onSelectYear(year)}>
                {year}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
