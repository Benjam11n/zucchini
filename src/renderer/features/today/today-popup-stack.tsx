import type { PopupEvent } from "./types";

interface TodayPopupStackProps {
  popups: PopupEvent[];
}

export function TodayPopupStack({ popups }: TodayPopupStackProps) {
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      {popups.map((popup) => (
        <div
          key={popup.id}
          className="pointer-events-auto flex w-88 animate-in items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 fade-in-0 slide-in-from-bottom-4 duration-200 shadow-lg"
        >
          <img
            alt="Mascot"
            className="size-16 shrink-0 object-contain drop-shadow-sm"
            src={popup.mascot}
          />
          <div className="grid gap-1">
            <h4 className="text-sm font-bold text-foreground">{popup.title}</h4>
            <p className="text-xs text-muted-foreground">{popup.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
