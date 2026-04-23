import { useListQuotes, useUpdateQuoteStatus, getListQuotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
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

export default function AdminQuotes() {
  const queryClient = useQueryClient();
  const { data: quotes = [], isLoading } = useListQuotes();
  const updateStatus = useUpdateQuoteStatus();

  function handleStatusChange(id: number, status: string) {
    updateStatus.mutate({ id, data: { status: status as "pending" | "reviewed" | "quoted" | "accepted" | "declined" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey() }),
    });
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-6">Quote Requests</h1>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-100 h-28 rounded-xl animate-pulse" />)}</div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No quote requests yet.</div>
        ) : (
          <div className="space-y-4">
            {quotes.map((q) => (
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
        )}
      </div>
    </AdminLayout>
  );
}
