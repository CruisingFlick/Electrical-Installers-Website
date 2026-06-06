export interface CalEvent {
  title: string;
  start: Date;
  durationMins?: number;
  description?: string;
  location?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsUtc(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcs(events: CalEvent[]): string {
  const now = toIcsUtc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Electrical Installers//Bookings//EN",
    "CALSCALE:GREGORIAN",
  ];
  events.forEach((ev, i) => {
    const end = new Date(ev.start.getTime() + (ev.durationMins ?? 60) * 60000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.start.getTime()}-${i}@electricalinstallers.com.au`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsUtc(ev.start)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:${escapeIcs(ev.title)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeIcs(ev.location)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function googleCalendarUrl(ev: CalEvent): string {
  const end = new Date(ev.start.getTime() + (ev.durationMins ?? 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${toIcsUtc(ev.start)}/${toIcsUtc(end)}`,
  });
  if (ev.description) params.set("details", ev.description);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const BUSINESS_TIMEZONE = "Australia/Melbourne";

function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map["year"]),
    Number(map["month"]) - 1,
    Number(map["day"]),
    Number(map["hour"]),
    Number(map["minute"]),
    Number(map["second"]),
  );
  return asUTC - date.getTime();
}

// Interpret the given wall-clock parts as Melbourne business time, return the matching UTC instant.
export function melbourneWallClockToUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, mo, d, h, mi);
  const offset = tzOffsetMs(new Date(guess), BUSINESS_TIMEZONE);
  return new Date(guess - offset);
}

function parseTime(timeText: string, fallbackHour = 9): { h: number; min: number } {
  const m = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return { h: fallbackHour, min: 0 };
  let h = parseInt(m[1] ?? "9", 10);
  const min = parseInt(m[2] ?? "0", 10);
  const ap = (m[3] ?? "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return { h, min };
}

export function parseSlotDate(dateStr: string, slot: string): Date | null {
  if (!dateStr) return null;
  const dm = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!dm) return null;
  const { h, min } = parseTime(slot);
  return melbourneWallClockToUtc(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), h, min);
}

export function parsePreferredDate(text: string): Date | null {
  if (!text) return null;
  const dm = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!dm) return null;
  const cal = new Date(`${dm[2]} ${dm[1]}, ${dm[3]}`);
  if (isNaN(cal.getTime())) return null;
  const { h, min } = parseTime(text);
  return melbourneWallClockToUtc(cal.getFullYear(), cal.getMonth(), cal.getDate(), h, min);
}
