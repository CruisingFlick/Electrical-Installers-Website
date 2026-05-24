import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useListBookings } from "@workspace/api-client-react";

type Booking = {
  id: number;
  customerName: string;
  jobType: string;
  suburb: string;
  preferredDate: string;
  status: string;
  serviceType: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

function parseBookingDate(preferredDate: string): Date | null {
  // Try to extract a date from strings like "Monday, 2 June 2025 at 9:00 AM"
  const match = preferredDate.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const parsed = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  // Try ISO date
  const direct = new Date(preferredDate);
  if (!isNaN(direct.getTime())) return direct;
  return null;
}

export default function AdminCalendarView() {
  const { data: bookings = [], isLoading } = useListBookings();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  // Start week on Monday (0=Mon)
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

  const monthName = viewDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Booking Calendar</h1>
          <div className="flex items-center gap-3">
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
                              className={`text-[10px] leading-tight px-1.5 py-0.5 rounded border font-medium truncate ${
                                statusColors[b.status] ?? "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                              title={`${b.customerName} — ${b.jobType} (${b.suburb})`}
                            >
                              {b.customerName}
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-[10px] text-gray-400 font-medium pl-1">
                              +{dayBookings.length - 3} more
                            </div>
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
      </div>
    </AdminLayout>
  );
}
