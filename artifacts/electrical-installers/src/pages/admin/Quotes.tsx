import { useListQuotes, useUpdateQuoteStatus, getListQuotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { X, Search, Download } from "lucide-react";
import AdminLayout from "./AdminLayout";

function PhotoThumbnail({ src, label }: { src: string; label: string }) {
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-[hsl(25,95%,53%)] transition-colors"
        style={{ width: 72, height: 56 }}
        title={label}
      >
        <img src={src} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
          <span className="text-white text-[10px] font-medium">{label}</span>
        </div>
      </button>
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(false)}>
            <X size={28} />
          </button>
          <img
            src={src}
            alt={label}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white text-sm font-medium">{label}</p>
        </div>
      )}
    </>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewed: "bg-blue-100 text-blue-800",
  quoted: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS = ["all", "pending", "reviewed", "quoted", "accepted", "declined"] as const;

type Quote = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  suburb: string;
  jobType: string;
  description: string;
  status: string;
  createdAt: string;
  switchboardImageUrl?: string | null;
  fasciImageUrl?: string | null;
  streetImageUrl?: string | null;
};

function exportCsv(quotes: Quote[]) {
  const headers = ["ID", "Name", "Email", "Phone", "Suburb", "Job Type", "Description", "Status", "Created At"];
  const rows = quotes.map((q) => [
    q.id,
    q.customerName,
    q.customerEmail,
    q.customerPhone ?? "",
    q.suburb,
    q.jobType,
    (q.description ?? "").replace(/"/g, '""'),
    q.status,
    new Date(q.createdAt).toLocaleDateString("en-AU"),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quotes-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminQuotes() {
  const queryClient = useQueryClient();
  const { data: quotes = [], isLoading } = useListQuotes();
  const updateStatus = useUpdateQuoteStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("all");

  function handleStatusChange(id: number, status: string) {
    updateStatus.mutate({ id, data: { status: status as "pending" | "reviewed" | "quoted" | "accepted" | "declined" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey() }),
    });
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return quotes.filter((quote) => {
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        quote.customerName.toLowerCase().includes(q) ||
        quote.customerEmail.toLowerCase().includes(q) ||
        (quote.suburb ?? "").toLowerCase().includes(q) ||
        (quote.jobType ?? "").toLowerCase().includes(q) ||
        (quote.description ?? "").toLowerCase().includes(q) ||
        (quote.customerPhone ?? "").includes(q)
      );
    });
  }, [quotes, search, statusFilter]);

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Quote Requests</h1>
          <button
            onClick={() => exportCsv(filtered as Quote[])}
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
              placeholder="Search by name, email, suburb, job type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              data-testid="quotes-search"
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
                data-testid={`filter-quote-status-${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-100 h-28 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {quotes.length === 0 ? "No quote requests yet." : "No quotes match your search."}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">Showing {filtered.length} of {quotes.length} quote{quotes.length !== 1 ? "s" : ""}</p>
            <div className="space-y-4">
              {filtered.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" data-testid={`quote-${q.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-[hsl(214,60%,14%)]">{q.customerName}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[q.status] ?? "bg-gray-100 text-gray-800"}`}>{q.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{q.customerEmail} {q.customerPhone && `| ${q.customerPhone}`} | {q.suburb}</p>
                      <p className="text-sm font-medium text-[hsl(214,60%,14%)]">{q.jobType}</p>
                      <p className="text-sm text-gray-600 mt-1">{q.description}</p>

                      {/* Photo thumbnails — click to enlarge */}
                      {(q.switchboardImageUrl || q.fasciImageUrl || q.streetImageUrl) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {q.switchboardImageUrl && <PhotoThumbnail src={q.switchboardImageUrl} label="Switchboard" />}
                          {q.fasciImageUrl && <PhotoThumbnail src={q.fasciImageUrl} label="Fascia/POA" />}
                          {q.streetImageUrl && <PhotoThumbnail src={q.streetImageUrl} label="Street/Pit" />}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(q.createdAt).toLocaleDateString("en-AU")}</p>
                    </div>
                    <div>
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                        data-testid={`quote-status-${q.id}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="quoted">Quoted</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
