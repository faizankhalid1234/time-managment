"use client";

import { useEffect, useState } from "react";

/** Pakistan timezone helpers for the client */

const TZ = "Asia/Karachi";

export function formatPkNow(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-PK", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthIndex = Number(parts.month) - 1;

  return {
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    dayPeriod: parts.dayPeriod,
    displayDate: `${parts.weekday}, ${parts.day}/${parts.month}/${parts.year}`,
    displayTime: `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod}`,
    shortDate: `${parts.day} ${monthNames[monthIndex]} ${parts.year}`,
    weekday: parts.weekday,
    weekdayShort: parts.weekday.slice(0, 3),
  };
}

export type PkNow = ReturnType<typeof formatPkNow>;

export const PK_CLOCK_PLACEHOLDER: PkNow = {
  hour: "--",
  minute: "--",
  second: "--",
  dayPeriod: "",
  displayDate: "",
  displayTime: "",
  shortDate: "",
  weekday: "",
  weekdayShort: "",
};

/** Live Pakistan clock — starts after mount to avoid SSR hydration mismatch */
export function usePkClock() {
  const [now, setNow] = useState<PkNow>(PK_CLOCK_PLACEHOLDER);

  useEffect(() => {
    setNow(formatPkNow());
    const id = setInterval(() => setNow(formatPkNow()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

export function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(sec).padStart(2, "0"),
    text: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
  };
}

export function hoursFromSeconds(sec: number) {
  return Math.round((sec / 3600) * 100) / 100;
}
