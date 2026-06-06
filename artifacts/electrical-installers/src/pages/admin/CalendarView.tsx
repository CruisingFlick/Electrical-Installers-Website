import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Mail, MapPin, Briefcase, Calendar, Download, Rss, X, Copy, Check } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useListBookings } from "@workspace/api-client-react";
import BookingDetailDrawer from "./BookingDetailDrawer";
import { buildIcs, downloadIcs, parsePreferredDate, type CalEvent } from "@/lib/calendar";

type Booking = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceType: string;
  jobType: string;
  suburb: string;
  preferredDate: string;
  message?: string | null;
  photoUrl?: string | null;
  adminNotes?: string | null;
  status: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const statusDot: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-400",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
};

function parseBookingDate(preferredDate: string): Date | null {
  const match = preferredDate.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const parsed = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const direct = new Date(preferredDate);
  if (!isNaN(direct.getTime())) return direct;
  return null;
}

function BookingTooltip({ booking }: { booking: Booking }) {
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 bg-[hsl(214,60%,14%)] text-white rounded-xl shadow-2xl p-3 text-left pointer-events-none">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[booking.status] ?? "bg-gray-400"}`} />
        <p className="font-semibold text-sm truncate">{booking.customerName}</p>
        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
          booking.status === "pending" ? "bg-amber-500/30 text-amber-300" :
          booking.status === "confirmed" ? "bg-blue-500/30 text-blue-300" :
          booking.status === "completed" ? "bg-green-500/30 text-green-300" :
          "bg-red-500/30 text-red-300"
        }`}>{booking.status}</span>
      </div>
      <div className="space-y-1.5 text-xs text-blue-100">
        <div className="flex items-center gap-2">
          <Mail size={11} className="shrink-0 text-orange-400" />
          <span className="truncate">{booking.customerEmail}</span>
        </div>
        {booking.customerPhone && (
          <div className="flex items-center gap-2">
            <Phone size={11} className="shrink-0 text-orange-400" />
            <span>{booking.customerPhone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <MapPin size={11} className="shrink-0 text-orange-400" />
          <span>{booking.suburb}</span>
        </div>
        <div className="flex items-start gap-2">
          <Briefcase size={11} className="shrink-0 text-orange-400 mt-0.5" />
          <span className="capitalize">{booking.serviceType} — {booking.jobType}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={11} className="shrink-0 text-orange-400" />
          <span className="truncate">{booking.preferredDate}</span>
        </div>
      </div>
      <p className="text-[10px] text-blue-300 mt-2 text-center">Click to open full details</p>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[hsl(214,60%,14%)]" />
    </div>
  );
}

export default function AdminCalendarView() {
  const { data: bookings = [], isLoading } = useListBookings();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredBookingId, setHoveredBookingId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [feedUrls, setFeedUrls] = useState<{ httpsUrl: string; webcalUrl: string } | null>(null);
  const [feedError, setFeedError] = useState(false);
  const [copied, setCopied] = useState(false);

  async function openSubscribe() {
    setSubscribeOpen(true);
    setFeedError(false);
    if (feedUrls) return;
    try {
      const res = await fetch("/api/admin/calendar/feed-url", { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      setFeedUrls(await res.json());
    } catch {
      setFeedError(true);
    }
  }

  async function copyFeedUrl() {
    if (!feedUrls) return;
    try {
      await navigator.clipboard.writeText(feedUrls.httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7;

  const bookingsByDay = useMemo(() => {
    const map: Record<number, Booking[]> = {};
    for (const b of bookings as Booking[]) {
      const d = parseBookingDate(b.preferredDate);
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(b);
      }
    }
    return map;
  }, [bookings, year, month]);

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function exportAll() {
    const events: CalEvent[] = [];
    for (const b of bookings as Booking[]) {
      if (b.status === "cancelled") continue;
      const start = parsePreferredDate(b.preferredDate);
      if (!start) continue;
      events.push({
        title: `${b.customerName} — ${b.serviceType}`,
        start,
        durationMins: 60,
        location: b.suburb || undefined,
        description: [
          `${b.serviceType} — ${b.jobType}`,
          b.customerPhone ? `Phone: ${b.customerPhone}` : "",
          b.customerEmail ? `Email: ${b.customerEmail}` : "",
        ].filter(Boolean).join("\n"),
      });
    }
    if (events.length > 0) downloadIcs("electrical-installers-jobs.ics", buildIcs(events));
  }

  const monthName = viewDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Booking Calendar</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openSubscribe}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-[hsl(25,95%,53%)] text-white hover:bg-[hsl(25,95%,47%)] transition-colors"
              title="Subscribe once so new jobs appear in your calendar automatically"
            >
              <Rss size={16} />
              Auto-sync calendar
            </button>
            <button
              onClick={exportAll}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-gray-200 text-[hsl(214,60%,14%)] hover:border-[hsl(25,95%,53%)] transition-colors"
              title="Download all jobs as a calendar file you can import into Google, Apple or Outlook calendar"
            >
              <Download size={16} className="text-[hsl(25,95%,53%)]" />
              Export (one-off)
            </button>
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-[hsl(214,60%,14%)] min-w-[160px] text-center">{monthName}</span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(statusColors).map(([status, cls]) => (
            <div key={status} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
              <span className="capitalize">{status}</span>
            </div>
          ))}
          <span className="text-xs text-gray-400 self-center ml-2">Hover for details · Click to open</span>
        </div>

        {isLoading ? (
          <div className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-[hsl(214,60%,14%)]">
              {dayNames.map((d) => (
                <div key={d} className="text-center py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {cells.map((day, idx) => {
                const dayBookings = day ? (bookingsByDay[day] ?? []) : [];
                const isToday = day === todayDay;
                const isWeekend = (idx % 7) >= 5;
                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 ${
                      !day ? "bg-gray-50/50" : isWeekend ? "bg-orange-50/30" : "bg-white"
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-[hsl(25,95%,53%)] text-white"
                            : "text-gray-500"
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 3).map((b) => (
                            <div
                              key={b.id}
                              className={`relative text-[10px] leading-tight px-1.5 py-0.5 rounded border font-medium truncate cursor-pointer transition-all hover:shadow-md hover:scale-[1.03] hover:z-10 ${
                                statusColors[b.status] ?? "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                              onMouseEnter={() => setHoveredBookingId(b.id)}
                              onMouseLeave={() => setHoveredBookingId(null)}
                              onClick={() => setSelectedBooking(b)}
                            >
                              {hoveredBookingId === b.id && <BookingTooltip booking={b} />}
                              {b.customerName}
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <button
                              className="text-[10px] text-[hsl(25,95%,53%)] font-semibold pl-1 hover:underline"
                              onClick={() => setSelectedBooking(dayBookings[3])}
                            >
                              +{dayBookings.length - 3} more
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photo lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <img
              src={lightboxUrl}
              alt="Job photo"
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Booking detail drawer */}
        <BookingDetailDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onLightbox={(url) => setLightboxUrl(url)}
          onUpdate={(updated) => setSelectedBooking(updated)}
        />

        {/* Auto-sync subscribe modal */}
        {subscribeOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSubscribeOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[hsl(214,60%,14%)] flex items-center gap-2">
                  <Rss size={18} className="text-[hsl(25,95%,53%)]" />
                  Auto-sync your calendar
                </h2>
                <button
                  onClick={() => setSubscribeOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-gray-600">
                  Subscribe to this private link <strong>once</strong> in your calendar app. New and
                  updated jobs will then appear automatically — no need to export again.
                </p>

                {feedError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Couldn't load your subscribe link. Please refresh and try again.
                  </div>
                )}

                {!feedUrls && !feedError && (
                  <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                )}

                {feedUrls && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Your private calendar link
                      </label>
                      <div className="flex items-stretch gap-2">
                        <input
                          readOnly
                          value={feedUrls.httpsUrl}
                          onFocus={(e) => e.currentTarget.select()}
                          className="flex-1 min-w-0 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
                        />
                        <button
                          onClick={copyFeedUrl}
                          className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-[hsl(214,60%,14%)] text-white hover:bg-[hsl(214,60%,20%)] transition-colors"
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://calendar.google.com/calendar/u/0/r/settings/addbyurl?cid=${encodeURIComponent(feedUrls.httpsUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-gray-200 text-[hsl(214,60%,14%)] hover:border-[hsl(25,95%,53%)] transition-colors"
                      >
                        <Calendar size={15} className="text-[hsl(25,95%,53%)]" />
                        Add to Google Calendar
                      </a>
                      <a
                        href={feedUrls.webcalUrl}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-gray-200 text-[hsl(214,60%,14%)] hover:border-[hsl(25,95%,53%)] transition-colors"
                      >
                        <Calendar size={15} className="text-[hsl(25,95%,53%)]" />
                        Add to Apple / Outlook
                      </a>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-900 space-y-2">
                      <p className="font-semibold">How to add it</p>
                      <p>
                        <strong>iPhone / Mac (Apple Calendar):</strong> tap “Add to Apple / Outlook”
                        above, then confirm Subscribe.
                      </p>
                      <p>
                        <strong>Google Calendar:</strong> tap “Add to Google Calendar”, or in
                        Google Calendar go to <em>Other calendars → From URL</em> and paste the link.
                      </p>
                      <p>
                        <strong>Outlook:</strong> Add calendar → Subscribe from web → paste the link.
                      </p>
                      <p className="text-blue-700">
                        Calendars refresh on their own schedule — usually within a few hours (Google
                        can take up to a day). Keep this link private; anyone with it can view your
                        job schedule.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
