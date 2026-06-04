import { useState } from "react";
import { Search, CheckCircle, Clock, AlertCircle, XCircle, Phone } from "lucide-react";

type BookingStatus = {
  id: number;
  customerName: string;
  jobType: string;
  suburb: string;
  serviceType: string;
  status: string;
  preferredDate: string;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string; desc: string }> = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    desc: "We've received your booking and will be in touch within one business day to confirm.",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    desc: "Your booking has been confirmed. Our electrician will be in contact if they need to reach you.",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    desc: "Job complete — thank you for choosing Electrical Installers!",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    desc: "This booking has been cancelled. Please call us if you'd like to rebook.",
  },
};

export default function TrackBookingPage() {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<BookingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/bookings/track?id=${encodeURIComponent(bookingId)}&email=${encodeURIComponent(email.trim())}`,
        { credentials: "same-origin" }
      );
      if (res.ok) {
        const data = await res.json() as BookingStatus;
        setResult(data);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Booking not found. Please check your booking ID and email address.");
      }
    } catch {
      setError("Unable to reach the server. Please try again or call us on 0419 868 703.");
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Track Your Booking</h1>
          <p className="text-gray-300 text-lg max-w-xl">
            Enter your booking reference number and email address to check the status of your appointment.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold text-[hsl(214,60%,14%)] mb-1">Enter Your Details</h2>
          <p className="text-sm text-gray-500 mb-6">Your booking ID was included in the confirmation email we sent you.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
              <input
                type="number"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="e.g. 42"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                data-testid="input-booking-id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="The email you used when booking"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                data-testid="input-booking-email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
              data-testid="button-track-booking"
            >
              <Search size={18} />
              {loading ? "Looking up…" : "Check Status"}
            </button>
          </form>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Booking not found</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && statusConfig && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-6 ${statusConfig.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <statusConfig.icon size={24} className={statusConfig.color} />
                <div>
                  <p className="font-bold text-lg text-[hsl(214,60%,14%)]">{statusConfig.label}</p>
                  <p className={`text-sm ${statusConfig.color}`}>{statusConfig.desc}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">Booking Details</h3>
              <dl className="space-y-3">
                {[
                  { label: "Booking ID", value: `#${result.id}` },
                  { label: "Name", value: result.customerName },
                  { label: "Job Type", value: result.jobType },
                  { label: "Suburb", value: result.suburb },
                  { label: "Service", value: result.serviceType.charAt(0).toUpperCase() + result.serviceType.slice(1) },
                  { label: "Preferred Date", value: result.preferredDate },
                  { label: "Submitted", value: new Date(result.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-gray-500 font-medium">{label}</dt>
                    <dd className="text-[hsl(214,60%,14%)] font-semibold text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-[hsl(210,20%,97%)] rounded-xl border border-gray-100 p-5 text-center">
              <p className="text-sm text-gray-600 mb-3">Need to make changes or have a question?</p>
              <a
                href="tel:0419868703"
                className="inline-flex items-center gap-2 bg-[hsl(214,60%,14%)] text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-[hsl(214,60%,20%)] transition-colors text-sm"
              >
                <Phone size={16} />
                Call Us — 0419 868 703
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
