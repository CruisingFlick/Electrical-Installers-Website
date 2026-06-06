export const BUSINESS_TIMEZONE = "Australia/Melbourne";

// Offset (ms) between the given timezone's wall clock and UTC at a point in time.
export function tzOffsetMs(date: Date, timeZone: string = BUSINESS_TIMEZONE): number {
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

// Interpret year/month/day/hour/minute as wall-clock time in `timeZone`, return the UTC instant.
export function wallClockToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string = BUSINESS_TIMEZONE,
): Date {
  const guess = Date.UTC(y, mo, d, h, mi);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

// Parse free-text dates like "15 June 2026 at 9:00 AM" as Melbourne wall-clock time.
export function parseAuDateTime(text: string): Date | null {
  if (!text) return null;
  const dm = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!dm) return null;
  const cal = new Date(`${dm[2]} ${dm[1]}, ${dm[3]}`);
  if (isNaN(cal.getTime())) return null;
  let h = 9;
  let min = 0;
  const tm = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (tm) {
    h = parseInt(tm[1] ?? "9", 10);
    min = parseInt(tm[2] ?? "0", 10);
    const ap = (tm[3] ?? "").toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
  }
  return wallClockToUtc(cal.getFullYear(), cal.getMonth(), cal.getDate(), h, min, BUSINESS_TIMEZONE);
}

export function icsDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    p(d.getUTCMonth() + 1) +
    p(d.getUTCDate()) +
    "T" +
    p(d.getUTCHours()) +
    p(d.getUTCMinutes()) +
    p(d.getUTCSeconds()) +
    "Z"
  );
}

export function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export type IcalEventInput = {
  uid: string;
  start: Date;
  durationMins?: number;
  summary: string;
  description?: string;
  location?: string;
};

export function buildVEvent(ev: IcalEventInput): string[] {
  const end = new Date(ev.start.getTime() + (ev.durationMins ?? 60) * 60000);
  const lines = [
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(ev.start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(ev.summary)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`);
  if (ev.location) lines.push(`LOCATION:${escapeIcs(ev.location)}`);
  lines.push("END:VEVENT");
  return lines;
}

export type CalendarOptions = {
  method?: "PUBLISH";
  name?: string;
};

export function wrapCalendar(events: IcalEventInput[], opts: CalendarOptions = {}): string {
  const out = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Electrical Installers//Bookings//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${opts.method ?? "PUBLISH"}`,
  ];
  if (opts.name) {
    out.push(`X-WR-CALNAME:${escapeIcs(opts.name)}`);
    out.push(`NAME:${escapeIcs(opts.name)}`);
  }
  out.push(`X-WR-TIMEZONE:${BUSINESS_TIMEZONE}`);
  for (const ev of events) out.push(...buildVEvent(ev));
  out.push("END:VCALENDAR");
  return out.join("\r\n");
}

// Single-event calendar (e.g. an email attachment).
export function buildSingleEventIcs(ev: IcalEventInput): string {
  return wrapCalendar([ev]);
}
