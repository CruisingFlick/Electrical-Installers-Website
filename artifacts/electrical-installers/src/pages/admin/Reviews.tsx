import { useListReviews, useUpdateReviewStatus, useDeleteReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Star, CheckCircle, XCircle, Trash2 } from "lucide-react";
import AdminLayout from "./AdminLayout";

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useListReviews();
  const updateStatus = useUpdateReviewStatus();
  const del = useDeleteReview();

  function approve(id: number) {
    updateStatus.mutate({ id, data: { status: "approved" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() }),
    });
  }

  function reject(id: number) {
    updateStatus.mutate({ id, data: { status: "rejected" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() }),
    });
  }

  function handleDelete(id: number) {
    if (confirm("Delete this review?")) {
      del.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() }) });
    }
  }

  const pending = reviews.filter(r => r.status === "pending");
  const approved = reviews.filter(r => r.status === "approved");
  const rejected = reviews.filter(r => r.status === "rejected");

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Review Moderation</h1>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-100 h-20 rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Pending Approval ({pending.length})</h2>
                <div className="space-y-3">
                  {pending.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl border-2 border-amber-100 p-5" data-testid={`review-pending-${r.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{r.customerName}</p>
                            <span className="text-xs text-gray-500">&bull; {r.suburb}</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={12} className={i < r.rating ? "text-[hsl(25,95%,53%)] fill-[hsl(25,95%,53%)]" : "text-gray-300"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 italic">&ldquo;{r.comment}&rdquo;</p>
                          <p className="text-xs text-gray-500 mt-1">{r.serviceType}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button onClick={() => approve(r.id)} className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-medium" data-testid={`button-approve-review-${r.id}`}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button onClick={() => reject(r.id)} className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-medium" data-testid={`button-reject-review-${r.id}`}>
                            <XCircle size={14} /> Reject
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1" data-testid={`button-delete-review-${r.id}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {approved.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3">Approved ({approved.length})</h2>
                <div className="space-y-2">
                  {approved.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl border border-green-100 p-4 flex items-start justify-between" data-testid={`review-approved-${r.id}`}>
                      <div>
                        <p className="font-medium text-sm">{r.customerName} &bull; {r.suburb}</p>
                        <p className="text-sm text-gray-600 mt-0.5 italic">&ldquo;{r.comment}&rdquo;</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => reject(r.id)} className="text-xs text-red-500 hover:underline">Reject</button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {rejected.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Rejected ({rejected.length})</h2>
                <div className="space-y-2">
                  {rejected.map((r) => (
                    <div key={r.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-start justify-between opacity-60" data-testid={`review-rejected-${r.id}`}>
                      <div>
                        <p className="font-medium text-sm">{r.customerName} &bull; {r.suburb}</p>
                        <p className="text-sm text-gray-500 italic mt-0.5">&ldquo;{r.comment}&rdquo;</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => approve(r.id)} className="text-xs text-green-600 hover:underline">Approve</button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reviews.length === 0 && (
              <div className="text-center py-16 text-gray-500">No reviews yet.</div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
