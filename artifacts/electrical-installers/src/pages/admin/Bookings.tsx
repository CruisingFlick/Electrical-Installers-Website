import { useListBookings, useDeleteBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, ImageIcon, Search, X, ChevronRight, Download, AlertTriangle } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useState, useMemo } from "react";
import BookingDetailDrawer from "./BookingDetailDrawer";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  scheduled: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS = ["all", "pending", "confirmed", "scheduled", "completed", "cancelled"] as const;

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

function exportCsv(bookings: Booking[]) {
  const headers = ["ID", "Name", "Email", "Phone", "Service", "Job Type", "Suburb", "Preferred Date", "Status", "Message", "Admin Notes", "Created At"];
  const rows = bookings.map((b) => [
    b.id,
    b.customerName,
    b.customerEmail,
    b.customerPhone ?? "",
    b.serviceType,
    b.jobType,
    b.suburb,
    b.preferredDate,
    b.status,
    (b.message ?? "").replace(/"/g, '""'),
    (b.adminNotes ?? "").replace(/"/g, '""'),
    new Date(b.createdAt).toLocaleDateString("en-AU"),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading } = useListBookings();
  const deleteBooking = useDeleteBooking();

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    deleteBooking.mutate(
      { id, data: { reason: deleteReason.trim() || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          if (selectedBooking?.id === id) setSelectedBooking(null);
          setDeleteTarget(null);
          setDeleteReason("");
        },
      }
    );
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (bookings as Booking[]).filter((b) => {
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Bookings</h1>
          <button
            onClick={() => exportCsv(filtered as Booking[])}
            className="flex items-center gap-2 text-sm border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            title="Export to CSV"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

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
            {(bookings as Booking[]).length === 0 ? "No bookings yet." : "No bookings match your search."}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {(bookings as Booking[]).length} booking{(bookings as Booking[]).length !== 1 ? "s" : ""} — click a row to view details &amp; schedule
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(210,20%,96%)] text-xs uppercase text-gray-500 tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Suburb</th>
                    <th className="px-4 py-3 text-left">Preferred Date</th>
                    <th className="px-4 py-3 text-left">Photo</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selectedBooking?.id === b.id ? "bg-blue-50/60" : ""}`}
                      onClick={() => setSelectedBooking(b)}
                      data-testid={`booking-row-${b.id}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-[hsl(214,60%,14%)]">{b.customerName}</p>
                        <p className="text-xs text-gray-500">{b.customerEmail}</p>
                        {b.customerPhone && <p className="text-xs text-gray-500">{b.customerPhone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="capitalize">{b.serviceType}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{b.jobType}</p>
                      </td>
                      <td className="px-4 py-3">{b.suburb}</td>
                      <td className="px-4 py-3">{b.preferredDate}</td>
                      <td className="px-4 py-3">
                        {b.photoUrl ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setLightboxUrl(b.photoUrl!); }}
                            className="block"
                            data-testid={`booking-photo-${b.id}`}
                          >
                            <img
                              src={b.photoUrl}
                              alt="Job photo"
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                            />
                          </button>
                        ) : (
                          <span className="text-gray-300"><ImageIcon size={18} /></span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColors[b.status] ?? "bg-gray-100 text-gray-800"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); }}
                            className="text-[hsl(214,60%,14%)] hover:text-[hsl(25,95%,53%)] p-1 rounded transition-colors"
                            title="View details"
                          >
                            <ChevronRight size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(b); setDeleteReason(""); }}
                            className="text-red-500 hover:text-red-700 p-1 rounded"
                            data-testid={`button-delete-booking-${b.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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

        {/* Booking detail drawer */}
        <BookingDetailDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onLightbox={(url) => setLightboxUrl(url)}
          onUpdate={(updated) => setSelectedBooking(updated)}
        />

        {/* Delete-with-reason modal */}
        {deleteTarget && (
          <div
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => { if (!deleteBooking.isPending) { setDeleteTarget(null); setDeleteReason(""); } }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 px-6 pt-6">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[hsl(214,60%,14%)]">Delete this job?</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {deleteTarget.customerName} · {deleteTarget.jobType} · {deleteTarget.suburb}
                  </p>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 mb-3">
                  The job is removed from your bookings list, but the customer's contact details are
                  kept and this job stays in their history with the reason below.
                </p>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Customer got someone else"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmDelete(); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 px-6 pb-6">
                <button
                  onClick={() => { setDeleteTarget(null); setDeleteReason(""); }}
                  disabled={deleteBooking.isPending}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteBooking.isPending}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  data-testid="button-confirm-delete-booking"
                >
                  <Trash2 size={15} />
                  {deleteBooking.isPending ? "Deleting…" : "Delete job"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
