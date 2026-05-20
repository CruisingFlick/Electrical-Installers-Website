import { useListBookings, useUpdateBookingStatus, useDeleteBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, ImageIcon, Search, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useState, useMemo } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading } = useListBookings();
  const updateStatus = useUpdateBookingStatus();
  const deleteBooking = useDeleteBooking();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("all");

  function handleStatusChange(id: number, status: string) {
    updateStatus.mutate({ id, data: { status: status as "pending" | "confirmed" | "completed" | "cancelled" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }),
    });
  }

  function handleDelete(id: number) {
    if (confirm("Delete this booking?")) {
      deleteBooking.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }),
      });
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        (b.suburb ?? "").toLowerCase().includes(q) ||
        (b.serviceType ?? "").toLowerCase().includes(q) ||
        (b.jobType ?? "").toLowerCase().includes(q) ||
        (b.customerPhone ?? "").includes(q)
      );
    });
  }, [bookings, search, statusFilter]);

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-6">Bookings</h1>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, suburb, service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              data-testid="bookings-search"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-[hsl(214,60%,14%)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                data-testid={`filter-status-${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-gray-100 h-12 rounded-lg animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {bookings.length === 0 ? "No bookings yet." : "No bookings match your search."}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(210,20%,96%)] text-xs uppercase text-gray-500 tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Job Type</th>
                    <th className="px-4 py-3 text-left">Suburb</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Photo</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50" data-testid={`booking-row-${b.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[hsl(214,60%,14%)]">{b.customerName}</p>
                        <p className="text-xs text-gray-500">{b.customerEmail}</p>
                        {b.customerPhone && <p className="text-xs text-gray-500">{b.customerPhone}</p>}
                      </td>
                      <td className="px-4 py-3 capitalize">{b.serviceType}</td>
                      <td className="px-4 py-3">{b.jobType}</td>
                      <td className="px-4 py-3">{b.suburb}</td>
                      <td className="px-4 py-3">{b.preferredDate}</td>
                      <td className="px-4 py-3">
                        {b.photoUrl ? (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(b.photoUrl!)}
                            className="block"
                            data-testid={`booking-photo-${b.id}`}
                          >
                            <img
                              src={b.photoUrl}
                              alt="Job photo"
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                            />
                          </button>
                        ) : (
                          <span className="text-gray-300"><ImageIcon size={20} /></span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[b.status] ?? "bg-gray-100 text-gray-800"}`}
                          data-testid={`booking-status-${b.id}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                          data-testid={`button-delete-booking-${b.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>
    </AdminLayout>
  );
}
