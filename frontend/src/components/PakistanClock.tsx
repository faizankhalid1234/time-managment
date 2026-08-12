"use client";

import { usePkClock } from "@/lib/time";

export function PakistanClock() {
  const now = usePkClock();

  return (
    <div
      className="clock-chip"
      aria-label={
        now.displayTime
          ? `${now.displayTime}, ${now.displayDate}, Pakistan`
          : "Pakistan time"
      }
    >
      <div className="flex items-baseline gap-1 font-display tabular-nums leading-none">
        <span className="clock-digit">{now.hour}</span>
        <span className="clock-colon">:</span>
        <span className="clock-digit">{now.minute}</span>
        <span className="clock-colon clock-colon-sec">:</span>
        <span className="clock-sec">{now.second}</span>
        <span className="clock-ampm">{now.dayPeriod}</span>
      </div>
      <div className="clock-meta">
        <span>{now.weekdayShort || "—"}</span>
        <span className="clock-dot" />
        <span>{now.shortDate || "Pakistan"}</span>
        <span className="clock-pk">PK</span>
      </div>
    </div>
  );
}
