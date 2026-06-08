import { useState, useMemo } from "react";
import { useListCustomers, useGetCustomer, useUpdateCustomer, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Search, Users, Phone, Mail, MapPin, Briefcase, Calendar, Tag, StickyNote, ChevronRight, X, CheckCircle, Save, Repeat2, Download, RefreshCw } from "lucide-react";
import BookingDetailDrawer from "./BookingDetailDrawer";

type Customer = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  suburb?: string | null;
  jobCount: number;
  lastJobDate?: string | null;
  lastServiceType?: string | null;
  marketingNotes?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
};

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
  deletedAt?: string | null;
  deletionReason?: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function CustomerDetailPanel({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetCustomer(customer.id);
  const updateCustomer = useUpdateCustomer();

  const [notes, setNotes] = useState(customer.marketingNotes ?? "");
  const [tagsValue, setTagsValue] = useState((customer.tags ?? []).join(", "));
  const [savedNotes, setSavedNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const bookings = (data as (Customer & { bookings: Booking[] }) | undefined)?.bookings ?? [];

  async function saveNotes() {
    setSaving(true);
    updateCustomer.mutate(
      {
        id: customer.id,
        data: {
          marketingNotes: notes || null,
          tags: tagsValue ? tagsValue.split(",").map((t) => t.trim()).filter(Boolean) : null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setSavedNotes(true);
          setTimeout(() => setSavedNotes(false), 2500);
          setSaving(false);
        },
        onError: () => setSaving(false),
      }
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[hsl(214,60%,14%)]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {customer.name}
              {customer.jobCount > 1 && (
                <span className="flex items-center gap-1 text-xs bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full font-semibold">
                  <Repeat2 size={11} />
                  Returning
                </span>
              )}
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">{customer.jobCount} job{customer.jobCount !== 1 ? "s" : ""} · added {new Date(customer.createdAt).toLocaleDateString("en-AU")}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact info */}
          <div className="px-6 py-5 space-y-2.5 border-b border-gray-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Contact Details</h3>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
              <a href={`mailto:${customer.email}`} className="text-[hsl(214,60%,14%)] hover:underline font-medium">{customer.email}</a>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                <a href={`tel:${customer.phone}`} className="text-[hsl(214,60%,14%)] hover:underline font-medium">{customer.phone}</a>
              </div>
            )}
            {customer.suburb && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                <span className="text-gray-700">{customer.suburb}</span>
              </div>
            )}
            {customer.lastServiceType && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                <span className="text-gray-700 capitalize">Last service: {customer.lastServiceType}</span>
              </div>
            )}
            {customer.lastJobDate && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                <span className="text-gray-700">Last job: {customer.lastJobDate}</span>
              </div>
            )}
          </div>

          {/* Marketing notes + tags */}
          <div className="px-6 py-5 border-b border-gray-50 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
              <StickyNote size={13} />
              Marketing Notes
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tags <span className="text-gray-400">(comma-separated)</span></label>
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. solar, repeat, referral, high-value"
                  value={tagsValue}
                  onChange={(e) => { setTagsValue(e.target.value); setSavedNotes(false); }}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                rows={3}
                placeholder="Internal notes for marketing & follow-up…"
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setSavedNotes(false); }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              />
            </div>
            <button
              onClick={saveNotes}
              disabled={saving}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                savedNotes
                  ? "bg-green-100 text-green-700"
                  : "bg-[hsl(214,60%,14%)] text-white hover:bg-[hsl(214,60%,20%)]"
              } disabled:opacity-50`}
            >
              {savedNotes ? <><CheckCircle size={13} /> Saved</> : <><Save size={13} /> {saving ? "Saving…" : "Save"}</>}
            </button>
          </div>

          {/* Booking history */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Job History</h3>
            {isLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <div key={i} className="bg-gray-100 h-10 rounded-lg animate-pulse" />)}</div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-gray-400">No bookings on record.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-colors group ${
                      b.deletedAt
                        ? "bg-red-50/60 border-red-100 hover:bg-red-50"
                        : "bg-gray-50 hover:bg-blue-50 border-gray-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-medium truncate capitalize ${b.deletedAt ? "text-gray-500 line-through" : "text-[hsl(214,60%,14%)]"}`}>{b.serviceType}</p>
                        {b.deletedAt ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Deleted</span>
                        ) : (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[b.status] ?? "bg-gray-100 text-gray-700"}`}>{b.status}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{b.jobType} · {b.suburb}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{b.preferredDate}</p>
                      {b.deletedAt && (
                        <p className="text-xs text-red-600 mt-1">
                          Job deleted{b.deletionReason ? ` — Reason: ${b.deletionReason}` : ""} · {new Date(b.deletedAt).toLocaleDateString("en-AU")}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[hsl(25,95%,53%)] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested booking drawer */}
      {selectedBooking && (
        <BookingDetailDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onLightbox={(url) => setLightboxUrl(url)}
          onUpdate={(updated) => setSelectedBooking(updated)}
        />
      )}

      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Job photo" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

export default function AdminCustomers() {
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading } = useListCustomers();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function syncFromBookings() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/customers/sync", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json() as { synced: number };
      await queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      setSyncMsg(`Synced ${data.synced} booking${data.synced !== 1 ? "s" : ""}`);
      setTimeout(() => setSyncMsg(null), 4000);
    } catch {
      setSyncMsg("Sync failed — try again");
    } finally {
      setSyncing(false);
    }
  }

  function exportCsv() {
    window.open("/api/admin/customers/export", "_blank");
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (customers as Customer[]).filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.suburb ?? "").toLowerCase().includes(q) ||
        (c.lastServiceType ?? "").toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (c.phone ?? "").includes(q)
      );
    });
  }, [customers, search]);

  const returning = (customers as Customer[]).filter((c) => c.jobCount > 1).length;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              All enquiries from bookings &amp; quotes · {(customers as Customer[]).length} contacts · {returning} returning
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {syncMsg && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
                {syncMsg}
              </span>
            )}
            <button
              onClick={syncFromBookings}
              disabled={syncing}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync from bookings"}
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[hsl(214,60%,14%)] text-white hover:bg-[hsl(214,60%,20%)] transition-colors"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-[hsl(214,60%,14%)]">{(customers as Customer[]).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Returning</p>
            <p className="text-2xl font-bold text-[hsl(25,95%,53%)]">{returning}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">With Notes/Tags</p>
            <p className="text-2xl font-bold text-[hsl(214,60%,14%)]">{(customers as Customer[]).filter((c) => c.marketingNotes || c.tags).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Total Jobs Done</p>
            <p className="text-2xl font-bold text-[hsl(214,60%,14%)]">{(customers as Customer[]).reduce((acc, c) => acc + c.jobCount, 0)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, suburb, service, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-gray-100 h-16 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            {(customers as Customer[]).length === 0
              ? "No customers yet. They'll appear here automatically when bookings are completed or cancelled."
              : "No customers match your search."}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {(customers as Customer[]).length} customers · click a row to view details &amp; edit
            </div>
            <div className="divide-y divide-gray-50">
              {(filtered as Customer[]).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50/40 transition-colors text-left group"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[hsl(214,60%,14%)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[hsl(214,60%,14%)]">{c.name}</p>
                      {c.jobCount > 1 && (
                        <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                          <Repeat2 size={10} />
                          {c.jobCount}× returning
                        </span>
                      )}
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {c.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.email}{c.suburb ? ` · ${c.suburb}` : ""}</p>
                    {c.lastServiceType && (
                      <p className="text-xs text-gray-400 capitalize">Last: {c.lastServiceType}{c.lastJobDate ? ` · ${c.lastJobDate}` : ""}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-[hsl(214,60%,14%)]">{c.jobCount} job{c.jobCount !== 1 ? "s" : ""}</p>
                    {c.marketingNotes && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                        <StickyNote size={10} /> notes
                      </p>
                    )}
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[hsl(25,95%,53%)] transition-colors ml-auto mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <CustomerDetailPanel customer={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </AdminLayout>
  );
}
