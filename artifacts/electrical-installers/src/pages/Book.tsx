import { useCreateBooking } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Calendar } from "lucide-react";
import { useState } from "react";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().optional(),
  serviceType: z.enum(["consulting", "quoting", "work"]),
  jobType: z.string().min(2, "Job type is required"),
  suburb: z.string().min(2, "Suburb is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  message: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

export default function BookPage() {
  const createBooking = useCreateBooking();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { customerName: "", customerEmail: "", customerPhone: "", serviceType: "consulting", jobType: "", suburb: "", preferredDate: "", message: "" },
  });

  async function onSubmit(data: BookingForm) {
    await createBooking.mutateAsync({ data }, {
      onSuccess: () => setSubmitted(true),
    });
  }

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Book an Appointment</h1>
          <p className="text-gray-300 text-lg">Choose your appointment type and we'll confirm a time that suits you.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Appointment types */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { value: "consulting", label: "Consulting", desc: "Talk through your project" },
            { value: "quoting", label: "Quoting", desc: "Get a firm price" },
            { value: "work", label: "Work", desc: "Book in scheduled work" },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => form.setValue("serviceType", type.value as "consulting" | "quoting" | "work")}
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
          <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-100">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Booking Received!</h2>
            <p className="text-gray-600 mt-2">Thanks for contacting us! We'll be in touch shortly to confirm your appointment.</p>
            <button onClick={() => { setSubmitted(false); form.reset(); }} className="mt-6 text-[hsl(25,95%,53%)] underline text-sm" data-testid="button-book-again">
              Make another booking
            </button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input {...form.register("customerName")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="John Smith" data-testid="input-booking-name" />
                {form.formState.errors.customerName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input {...form.register("customerEmail")} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="john@example.com" data-testid="input-booking-email" />
                {form.formState.errors.customerEmail && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerEmail.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input {...form.register("customerPhone")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="0400 000 000" data-testid="input-booking-phone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suburb <span className="text-red-500">*</span></label>
                <input {...form.register("suburb")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="Frankston" data-testid="input-booking-suburb" />
                {form.formState.errors.suburb && <p className="text-red-500 text-xs mt-1">{form.formState.errors.suburb.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type <span className="text-red-500">*</span></label>
              <select {...form.register("jobType")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="select-booking-job-type">
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
              {form.formState.errors.jobType && <p className="text-red-500 text-xs mt-1">{form.formState.errors.jobType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Preferred Date <span className="text-red-500">*</span>
              </label>
              <input {...form.register("preferredDate")} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="input-booking-date" />
              {form.formState.errors.preferredDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.preferredDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea {...form.register("message")} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="Any additional details..." data-testid="input-booking-message" />
            </div>
            <button
              type="submit"
              disabled={createBooking.isPending}
              className="w-full bg-[hsl(25,95%,53%)] text-white font-semibold py-3 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors disabled:opacity-60"
              data-testid="button-submit-booking"
            >
              {createBooking.isPending ? "Submitting..." : "Request Booking"}
            </button>
            <p className="text-xs text-gray-400 text-center">We will contact you within one business day to confirm.</p>
          </form>
        )}
      </div>
    </div>
  );
}
