import { cn } from "@/lib/utils";

type ContributionStatus = "complete" | "empty" | "freeze" | "missed";

interface GitHubCalendarCell {
  date: string;
  isToday: boolean;
  label: string;
  status: ContributionStatus;
}

interface GitHubCalendarWeek {
  cells: GitHubCalendarCell[];
  key: string;
}

interface GitHubCalendarProps {
  weeks: GitHubCalendarWeek[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEGEND_STATUSES: ContributionStatus[] = [
  "empty",
  "missed",
  "freeze",
  "complete",
];

const STATUS_STYLES: Record<ContributionStatus, string> = {
  complete: "border-primary/80 bg-primary",
  empty: "border-border/60 bg-transparent",
  freeze: "border-secondary/80 bg-secondary/75",
  missed: "border-border/70 bg-muted/55",
};

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonth(dateKey: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(
    parseDateKey(dateKey)
  );
}

function getMonthLabel(
  weeks: GitHubCalendarWeek[],
  index: number,
  dateKey: string
): string {
  if (index === 0) {
    return formatMonth(dateKey);
  }

  const previousDate =
    weeks[index - 1]?.cells[0]?.date ?? weeks[index - 1]?.key;

  if (!previousDate) {
    return formatMonth(dateKey);
  }

  return formatMonth(previousDate) === formatMonth(dateKey)
    ? ""
    : formatMonth(dateKey);
}

function ContributionSquare({ cell }: { cell: GitHubCalendarCell }) {
  return (
    <div
      aria-label={cell.label}
      className={cn(
        "size-3.5 rounded-[4px] border",
        STATUS_STYLES[cell.status],
        cell.isToday && "ring-1 ring-ring/60 ring-offset-1 ring-offset-card"
      )}
      role="img"
      title={cell.label}
    />
  );
}

function GitHubCalendar({ weeks }: GitHubCalendarProps) {
  if (weeks.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-border/60 bg-background/20 px-4 py-10 text-center text-sm text-muted-foreground">
        No history yet. Complete a day to populate the heatmap.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[28px] border border-border/60 bg-background/30 p-4 sm:p-5">
      <div className="min-w-max">
        <div className="mb-3 flex gap-1 pl-8 text-[11px] text-muted-foreground">
          {weeks.map((week, index) => {
            const dateKey = week.cells[0]?.date ?? week.key;

            return (
              <div key={week.key} className="w-3.5">
                <span className="block w-0 text-left">
                  {getMonthLabel(weeks, index, dateKey)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <div className="grid gap-1 pt-[2px] text-[11px] text-muted-foreground">
            {DAY_LABELS.map((day) => (
              <span key={day} className="flex h-3.5 items-center">
                {day}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {weeks.map((week) => (
              <div key={week.key} className="grid gap-1">
                {week.cells.map((cell) => (
                  <ContributionSquare key={cell.date} cell={cell} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
          <span>Less</span>
          {LEGEND_STATUSES.map((status) => (
            <div
              key={status}
              className={cn(
                "size-3.5 rounded-[4px] border",
                STATUS_STYLES[status]
              )}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export { GitHubCalendar };
