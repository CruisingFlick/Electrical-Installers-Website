import { useState } from "react";
import { X, Phone, Mail, MapPin, Calendar, Briefcase, MessageSquare, ImageIcon, CheckCircle, Clock } from "lucide-react";
import { useConfirmBooking, useUpdateBookingStatus, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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
  status: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

interface Props {
  booking: Booking | null;
  onClose: () => void;
  onLightbox: (url: string) => void;
}

export default function BookingDetailDrawer({ booking, onClose, onLightbox }: Props) {
  const queryClient = useQueryClient();
  const confirmBooking = useConfirmBooking();
  const updateStatus = useUpdateBookingStatus();

  const [confirmedDate, setConfirmedDate] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [sent, setSent] = useState(false);

  if (!booking) return null;

  function handleStatusChange(status: string) {
    if (!booking) return;
    updateStatus.mutate(
      { id: booking.id, data: { status: status as "pending" | "confirmed" | "completed" | "cancelled" } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }) }
    );
  }

  function handleConfirm() {
    if (!booking || !confirmedDate) return;
    confirmBooking.mutate(
      { id: booking.id, data: { confirmedDate, adminNote: adminNote || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          setSent(true);
        },
      }
    );
  }

  const isConfirmable = booking.status === "pending" || booking.status === "confirmed";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[hsl(214,60%,14%)]">
          <div>
            <h2 className="text-lg font-bold text-white">{booking.customerName}</h2>
            <p className="text-xs text-blue-200 mt-0.5">Booking #{booking.id} · submitted {new Date(booking.createdAt).toLocaleDateString("en-AU")}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status badge + change */}
          <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-gray-50">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusColors[booking.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {booking.status}
            </span>
            <select
              value={booking.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Customer details */}
          <div className="px-6 py-5 space-y-3 border-b border-gray-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer Details</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                <a href={`mailto:${booking.customerEmail}`} className="text-[hsl(214,60%,14%)] hover:underline font-medium truncate">
                  {booking.customerEmail}
                </a>
              </div>
              {booking.customerPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                  <a href={`tel:${booking.customerPhone}`} className="text-[hsl(214,60%,14%)] hover:underline font-medium">
                    {booking.customerPhone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                <span className="text-gray-700">{booking.suburb}</span>
              </div>
            </div>
          </div>

          {/* Job details */}
          <div className="px-6 py-5 space-y-3 border-b border-gray-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Job Details</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 text-sm">
                <Briefcase size={15} className="text-[hsl(25,95%,53%)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[hsl(214,60%,14%)] capitalize">{booking.serviceType}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{booking.jobType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={15} className="text-[hsl(25,95%,53%)] shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Customer's preferred date: </span>
                  <span className="font-semibold text-[hsl(214,60%,14%)]">{booking.preferredDate}</span>
                </div>
              </div>
              {booking.message && (
                <div className="flex items-start gap-3 text-sm">
                  <MessageSquare size={15} className="text-[hsl(25,95%,53%)] shrink-0 mt-0.5" />
                  <p className="text-gray-700 leading-relaxed">{booking.message}</p>
                </div>
              )}
              {booking.photoUrl && (
                <div className="flex items-start gap-3 text-sm">
                  <ImageIcon size={15} className="text-[hsl(25,95%,53%)] shrink-0 mt-0.5" />
                  <button
                    type="button"
                    onClick={() => onLightbox(booking.photoUrl!)}
                    className="block group"
                  >
                    <img
                      src={booking.photoUrl}
                      alt="Job photo"
                      className="w-28 h-28 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity"
                    />
                    <p className="text-xs text-gray-400 mt-1">Click to enlarge</p>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Schedule & confirm */}
          {isConfirmable && (
            <div className="px-6 py-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Schedule Job & Notify Customer</h3>

              {sent ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold">Confirmation sent!</p>
                    <p className="text-xs text-green-600 mt-0.5">The customer has been emailed with the scheduled date.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Confirmed Date &amp; Time <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. ${booking.preferredDate}, 9:00 AM`}
                      value={confirmedDate}
                      onChange={(e) => setConfirmedDate(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      <Clock size={11} className="inline mr-1" />
                      Customer requested: <strong>{booking.preferredDate}</strong>
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Message to Customer <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any additional info for the customer — parking, access, what to expect…"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                    />
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={!confirmedDate || confirmBooking.isPending}
                    className="w-full bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,46%)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    {confirmBooking.isPending ? "Sending…" : "Confirm & Send Email to Customer"}
                  </button>
                  {confirmBooking.isError && (
                    <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
