import { Clock } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

// value is "HH:MM" in 24-hour format
interface TimeInputProps {
  "aria-invalid"?: boolean;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));

const selectClass = cn(
  "appearance-none bg-transparent border-0 p-0 text-sm tabular-nums",
  "focus:outline-none cursor-pointer text-foreground"
);

export function TimeInput({
  id,
  value,
  onChange,
  className,
  "aria-invalid": ariaInvalid,
}: TimeInputProps) {
  const uid = useId();
  const inputId = id ?? uid;

  const [rawH = "08", rawM = "00"] = value.split(":");
  const hNum = Math.min(23, Math.max(0, Number.parseInt(rawH, 10)));
  const mNum = Math.min(59, Math.max(0, Number.parseInt(rawM, 10)));
  const hh = pad(hNum);
  const mm = pad(mNum);

  function emitHour(h: string) {
    onChange(`${h}:${mm}`);
  }
  function emitMinute(m: string) {
    onChange(`${hh}:${m}`);
  }

  return (
    <div
      aria-invalid={ariaInvalid}
      id={inputId}
      className={cn(
        "flex h-9 w-full items-center gap-1 rounded-md border border-input bg-background px-3",
        "text-sm shadow-sm ring-offset-background transition-colors",
        "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
    >
      <Clock className="size-3.5 shrink-0 text-muted-foreground" />

      {/* Hour */}
      <select
        aria-label="Hour"
        className={selectClass}
        value={hh}
        onChange={(e) => emitHour(e.target.value)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="text-muted-foreground select-none">:</span>

      {/* Minute */}
      <select
        aria-label="Minute"
        className={selectClass}
        value={mm}
        onChange={(e) => emitMinute(e.target.value)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
