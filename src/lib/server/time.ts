const TZ = "Asia/Karachi";

export function toPkParts(date = new Date()) {
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
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: parts.weekday,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    dayPeriod: parts.dayPeriod,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    displayDate: `${parts.weekday}, ${parts.day}/${parts.month}/${parts.year}`,
    displayTime: `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod}`,
    iso: date.toISOString(),
  };
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return {
    hours: h,
    minutes: m,
    seconds: sec,
    formatted: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
    label: h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`,
  };
}

export function getWeekDateKeys(baseDate = new Date()) {
  const parts = toPkParts(baseDate);
  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weekdayIndex = weekdayNames.indexOf(parts.weekday);
  const daysFromMonday = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
  const today = parseDateKey(parts.dateKey);
  const monday = addDays(today, -daysFromMonday);
  return Array.from({ length: 7 }, (_, i) => formatDateKey(addDays(monday, i)));
}

function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function addDays({ y, m, d }: { y: number; m: number; d: number }, n: number) {
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
  };
}

function formatDateKey({ y, m, d }: { y: number; m: number; d: number }) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export { TZ };
