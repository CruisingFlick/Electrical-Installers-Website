import { useListReviews, useCreateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { Star, CheckCircle, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

const reviewSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  suburb: z.string().min(2, "Suburb is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Please write at least 10 characters"),
  serviceType: z.string().min(1, "Please select a service"),
});
type ReviewForm = z.infer<typeof reviewSchema>;

type GoogleReviewItem = {
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhotoUrl?: string;
  time: number;
};
type GoogleReviewsData = {
  configured: boolean;
  rating: number | null;
  totalRatings: number | null;
  reviews: GoogleReviewItem[];
  reviewsUrl: string;
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          data-testid={`star-${i + 1}`}
        >
          <Star
            size={28}
            className={`transition-colors ${i < (hover || value) ? "text-[hsl(25,95%,53%)] fill-[hsl(25,95%,53%)]" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  usePageMeta({
    title: "Customer Reviews | Electrical Installers",
    description: "Read genuine customer reviews for Electrical Installers. Highly rated licensed electricians serving Mornington Peninsula, Bayside, and South East Melbourne.",
    path: "/reviews",
  });
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useListReviews({ status: "approved" }, { query: { queryKey: getListReviewsQueryKey({ status: "approved" }) } });
  const createReview = useCreateReview();
  const [submitted, setSubmitted] = useState(false);
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState<string>("");
  const [google, setGoogle] = useState<GoogleReviewsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/public")
      .then((r) => r.ok ? r.json() as Promise<{ googleReviewsUrl: string }> : Promise.resolve({ googleReviewsUrl: "" }))
      .then((d) => setGoogleReviewsUrl(d.googleReviewsUrl ?? ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/google-reviews")
      .then((r) => (r.ok ? (r.json() as Promise<GoogleReviewsData>) : Promise.resolve(null)))
      .then((d) => setGoogle(d))
      .catch(() => {});
  }, []);

  const effectiveReviewsUrl = google?.reviewsUrl || googleReviewsUrl;

  const [selectedRating, setSelectedRating] = useState(0);

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { customerName: "", suburb: "", rating: 0, comment: "", serviceType: "" },
  });

  function handleRatingSelect(value: number) {
    setSelectedRating(value);
    form.setValue("rating", value);
  }

  async function onSubmit(data: ReviewForm) {
    await createReview.mutateAsync({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ status: "approved" }) });
        setSubmitted(true);
        form.reset();
        setSelectedRating(0);
      },
    });
  }

  const isHighRating = selectedRating >= 4;
  const isLowRating = selectedRating >= 1 && selectedRating <= 3;

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Customer Reviews</h1>
          <p className="text-gray-300 text-lg">What our customers say about our work.</p>
          {google?.configured && google.rating != null && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/10 rounded-xl px-5 py-3" data-testid="google-rating-badge">
              <span className="text-3xl font-bold">{google.rating.toFixed(1)}</span>
              <div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < Math.round(google.rating!) ? "text-[hsl(25,95%,53%)] fill-[hsl(25,95%,53%)]" : "text-gray-500"} />
                  ))}
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  {google.totalRatings ?? 0} Google review{(google.totalRatings ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {google?.configured && google.reviews.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)]">From Google</h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Live</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {google.reviews.map((gr) => (
                <div key={gr.time} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm" data-testid={`google-review-${gr.time}`}>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < gr.rating ? "text-[hsl(25,95%,53%)] fill-[hsl(25,95%,53%)]" : "text-gray-300"} />
                    ))}
                    <span className="text-sm text-gray-500 ml-2">{gr.rating}/5</span>
                  </div>
                  <p className="text-gray-700 italic mb-4">&ldquo;{gr.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {gr.profilePhotoUrl && (
                      <img src={gr.profilePhotoUrl} alt={gr.authorName} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{gr.authorName}</p>
                      <p className="text-xs text-gray-500">{gr.relativeTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-32" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No reviews yet. Be the first to leave one below!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm" data-testid={`review-${review.id}`}>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < review.rating ? "text-[hsl(25,95%,53%)] fill-[hsl(25,95%,53%)]" : "text-gray-300"} />
                  ))}
                  <span className="text-sm text-gray-500 ml-2">{review.rating}/5</span>
                </div>
                <p className="text-gray-700 italic mb-4">&ldquo;{review.comment}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{review.customerName}</p>
                    <p className="text-xs text-gray-500">{review.suburb} &bull; {review.serviceType}</p>
                  </div>
                  {review.isVerified && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle size={12} />
                      Verified Customer
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Review */}
        <div className="bg-[hsl(210,20%,97%)] rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-2">Leave a Review</h2>
          <p className="text-gray-500 mb-6">Had work done? We'd love to hear about your experience.</p>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[hsl(214,60%,14%)]">Thank you for your feedback!</h3>
              <p className="text-gray-500 mt-2">Our team will review it and be in touch if needed.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-[hsl(25,95%,53%)] underline text-sm">Leave another review</button>
            </div>
          ) : (
            <>
              {/* Step 1: rating selector (gates the next step) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate us?</label>
                <StarRating value={selectedRating} onChange={handleRatingSelect} />
                {selectedRating === 0 && (
                  <p className="text-gray-400 text-sm mt-2">Select a rating to continue.</p>
                )}
              </div>

              {/* Step 2a: high rating -> steer to Google */}
              {isHighRating && (
                <div className="bg-white rounded-xl p-6 border border-gray-100" data-testid="high-rating-prompt">
                  <h3 className="text-lg font-bold text-[hsl(214,60%,14%)]">That's wonderful to hear! 🎉</h3>
                  <p className="text-gray-600 text-sm mt-1 mb-5">
                    Would you mind sharing your experience on Google? It only takes 30 seconds and helps other locals find us.
                  </p>
                  {effectiveReviewsUrl ? (
                    <a
                      href={effectiveReviewsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
                      data-testid="button-google-review-redirect"
                    >
                      <Star size={15} className="fill-white" />
                      Leave a Google Review
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Thanks so much for the {selectedRating}-star rating!</p>
                  )}
                </div>
              )}

              {/* Step 2b: low rating -> private feedback to admin */}
              {isLowRating && (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="low-rating-form">
                  <p className="text-sm text-gray-600 bg-white border border-gray-100 rounded-lg p-4">
                    We're sorry your experience wasn't perfect. Your feedback goes straight to our team so we can make it right — it won't be posted publicly.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                      <input {...form.register("customerName")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="John Smith" data-testid="input-review-name" />
                      {form.formState.errors.customerName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
                      <input {...form.register("suburb")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="Frankston" data-testid="input-review-suburb" />
                      {form.formState.errors.suburb && <p className="text-red-500 text-xs mt-1">{form.formState.errors.suburb.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select {...form.register("serviceType")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="select-review-service">
                      <option value="">Select service...</option>
                      <option value="New Home Wiring">New Home Wiring</option>
                      <option value="Renovation">Renovation</option>
                      <option value="3-Phase Upgrade">3-Phase Upgrade</option>
                      <option value="Underground Power">Underground Power</option>
                      <option value="Commercial">Commercial / Industrial</option>
                      <option value="Other">Other</option>
                    </select>
                    {form.formState.errors.serviceType && <p className="text-red-500 text-xs mt-1">{form.formState.errors.serviceType.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What could we have done better?</label>
                    <textarea {...form.register("comment")} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="Tell us about your experience..." data-testid="input-review-comment" />
                    {form.formState.errors.comment && <p className="text-red-500 text-xs mt-1">{form.formState.errors.comment.message}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={createReview.isPending}
                    className="bg-[hsl(25,95%,53%)] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors disabled:opacity-60"
                    data-testid="button-submit-review"
                  >
                    {createReview.isPending ? "Submitting..." : "Send Feedback"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
