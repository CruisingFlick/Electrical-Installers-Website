import { useCreateBooking } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Calendar, Phone, Clock, ShieldCheck, Star, ImagePlus, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().optional(),
  serviceType: z.enum(["consulting", "quoting", "work"]),
  jobType: z.string().min(2, "Job type is required"),
  suburb: z.string().min(2, "Suburb is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  message: z.string().optional(),
  photoUrl: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

const SERVICE_TYPES = [
  { value: "consulting", label: "Consulting", desc: "Talk through your project" },
  { value: "quoting", label: "Quoting", desc: "Get a firm price" },
  { value: "work", label: "Work", desc: "Book in scheduled work" },
];

const WHAT_HAPPENS = [
  { step: "1", title: "We review your request", desc: "Our team looks over your booking details and job type within one business day." },
  { step: "2", title: "We call to confirm", desc: "An electrician will call you to confirm the time, answer questions, and clarify scope." },
  { step: "3", title: "We show up on time", desc: "Our licensed electricians arrive at the agreed time, fully equipped for the job." },
];

export default function BookPage() {
  const createBooking = useCreateBooking();
  const [submitted, setSubmitted] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      serviceType: "consulting",
      jobType: "",
      suburb: "",
      preferredDate: "",
      message: "",
      photoUrl: "",
    },
  });

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      form.setValue("photoUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  }, [form]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearPhoto = () => {
    setPhotoPreview(null);
    form.setValue("photoUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(data: BookingForm) {
    setSubmitError(null);
    try {
      await createBooking.mutateAsync({ data });
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong submitting your booking. Please try again or call us on 0419 868 703.");
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] focus:border-transparent";

  return (
    <div>
      {/* Header */}
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Book an Appointment</h1>
          <p className="text-gray-300 text-lg max-w-xl">
            Choose your appointment type and we'll confirm a time that suits you — usually within one business day.
          </p>
        </div>
      </div>
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="lg:grid lg:grid-cols-3 lg:gap-14 items-start">

          {/* ── Left column: form ── */}
          <div className="lg:col-span-2">
            {/* Service type selector */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => form.setValue("serviceType", type.value as BookingForm["serviceType"])}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.watch("serviceType") === type.value
                      ? "border-[hsl(25,95%,53%)] bg-[hsl(25,95%,53%)]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  data-testid={`service-type-${type.value}`}
                >
                  <p className="font-semibold text-[hsl(214,60%,14%)] text-sm">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>

            {submitted ? (
              <div className="text-center py-16 bg-green-50 rounded-2xl border border-green-100">
                <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Booking Received!</h2>
                <p className="text-gray-600 mt-2 max-w-sm mx-auto">
                  Thanks for reaching out. We'll call you within one business day to confirm your appointment.
                </p>
                <button
                  onClick={() => { setSubmitted(false); form.reset(); setPhotoPreview(null); }}
                  className="mt-6 text-[hsl(25,95%,53%)] underline text-sm"
                  data-testid="button-book-again"
                >
                  Make another booking
                </button>
              </div>
            ) : (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.register("customerName")}
                      className={inputClass}
                      placeholder="John Smith"
                      data-testid="input-booking-name"
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.register("customerEmail")}
                      type="email"
                      className={inputClass}
                      placeholder="john@example.com"
                      data-testid="input-booking-email"
                    />
                    {form.formState.errors.customerEmail && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerEmail.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      {...form.register("customerPhone")}
                      className={inputClass}
                      placeholder="0400 000 000"
                      data-testid="input-booking-phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suburb <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.register("suburb")}
                      className={inputClass}
                      placeholder="Frankston"
                      data-testid="input-booking-suburb"
                    />
                    {form.formState.errors.suburb && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.suburb.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...form.register("jobType")}
                      className={inputClass}
                      data-testid="select-booking-job-type"
                    >
                      <option value="">Select job type...</option>
                      <option value="New Home Wiring">New Home Wiring</option>
                      <option value="Renovation">Renovation</option>
                      <option value="3-Phase Upgrade">3-Phase Upgrade</option>
                      <option value="Underground Power">Underground Power</option>
                      <option value="Switchboard Upgrade">Switchboard Upgrade</option>
                      <option value="Commercial Wiring">Commercial Wiring</option>
                      <option value="Fault Finding">Fault Finding</option>
                      <option value="Other">Other</option>
                    </select>
                    {form.formState.errors.jobType && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.jobType.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar size={14} className="inline mr-1" />
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...form.register("preferredDate")}
                      type="date"
                      className={inputClass}
                      data-testid="input-booking-date"
                    />
                    {form.formState.errors.preferredDate && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.preferredDate.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    {...form.register("message")}
                    rows={3}
                    className={inputClass}
                    placeholder="Any additional details about your job..."
                    data-testid="input-booking-message"
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Helps our electricians understand your job before they arrive.</p>

                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="Uploaded preview"
                        className="w-full max-h-48 object-cover rounded-xl border border-gray-200"
                        data-testid="photo-preview"
                      />
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 text-gray-600 hover:text-red-500"
                        data-testid="button-clear-photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 px-4 cursor-pointer transition-colors ${
                        isDragOver
                          ? "border-[hsl(25,95%,53%)] bg-[hsl(25,95%,53%)]/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      data-testid="photo-drop-zone"
                    >
                      <ImagePlus size={28} className="text-gray-400" />
                      <p className="text-sm text-gray-500">Drag &amp; drop a photo here</p>
                      <p className="text-xs text-gray-400">or click to browse files</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        data-testid="input-photo-file"
                      />
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={createBooking.isPending}
                  className="w-full bg-[hsl(25,95%,53%)] text-white font-semibold py-3 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors disabled:opacity-60"
                  data-testid="button-submit-booking"
                >
                  {createBooking.isPending ? "Submitting..." : "Request Booking"}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  We'll contact you within one business day to confirm.
                </p>
              </form>
            )}
          </div>

          {/* ── Right column: sidebar ── */}
          <div className="mt-12 lg:mt-0 space-y-8">

            {/* What happens next */}
            <div className="bg-[hsl(214,60%,14%)] text-white rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-5">What happens after you book?</h2>
              <ol className="space-y-5">
                {WHAT_HAPPENS.map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(25,95%,53%)] text-white text-sm font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Trust signals */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-[hsl(214,60%,14%)] uppercase tracking-wide">Why choose us</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-[hsl(25,95%,53%)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Licensed &amp; Insured</p>
                    <p className="text-xs text-gray-500">All work carried out by fully licensed electricians.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-[hsl(25,95%,53%)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">On-Time Guarantee</p>
                    <p className="text-xs text-gray-500">We respect your time and show up when we say we will.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star size={18} className="text-[hsl(25,95%,53%)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">5-Star Rated</p>
                    <p className="text-xs text-gray-500">Hundreds of happy customers across the Mornington Peninsula.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call us instead */}
            <div className="rounded-2xl border-2 border-[hsl(25,95%,53%)]/30 bg-[hsl(25,95%,53%)]/5 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Phone size={18} className="text-[hsl(25,95%,53%)]" />
                <h2 className="text-sm font-bold text-[hsl(214,60%,14%)]">Prefer to call?</h2>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Our team is available Monday – Friday, 7am – 5pm.
              </p>
              <a
                href="tel:0419868703"
                className="block text-center bg-[hsl(25,95%,53%)] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors"
              >0419 868 703</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
