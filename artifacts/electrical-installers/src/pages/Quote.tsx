import { useCreateQuote } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Upload, Info } from "lucide-react";
import { useState } from "react";

const quoteSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().optional(),
  suburb: z.string().min(2, "Suburb is required"),
  jobType: z.string().min(2, "Job type is required"),
  description: z.string().min(20, "Please describe the job in more detail"),
  switchboardImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  fasciImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  streetImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type QuoteForm = z.infer<typeof quoteSchema>;

export default function QuotePage() {
  const createQuote = useCreateQuote();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { customerName: "", customerEmail: "", customerPhone: "", suburb: "", jobType: "", description: "", switchboardImageUrl: "", fasciImageUrl: "", streetImageUrl: "" },
  });

  async function onSubmit(data: QuoteForm) {
    await createQuote.mutateAsync({ data: {
      ...data,
      switchboardImageUrl: data.switchboardImageUrl || undefined,
      fasciImageUrl: data.fasciImageUrl || undefined,
      streetImageUrl: data.streetImageUrl || undefined,
    }}, {
      onSuccess: () => setSubmitted(true),
    });
  }

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Virtual Quote Request</h1>
          <p className="text-gray-300 text-lg">Submit photos and details of your job and we'll get back to you with a quote.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            For the best quote, provide photo URLs of your switchboard, the fascia/Point of Attachment where the overhead service connects to your house, and the street curb area (for underground power jobs). You can upload photos to any image hosting service (e.g. Google Drive, Dropbox) and paste the link here.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-100">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Quote Request Received!</h2>
            <p className="text-gray-600 mt-2">Thank you for contacting us! We'll review your details and be in touch shortly.</p>
            <button onClick={() => { setSubmitted(false); form.reset(); }} className="mt-6 text-[hsl(25,95%,53%)] underline text-sm" data-testid="button-quote-again">
              Submit another quote
            </button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input {...form.register("customerName")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="John Smith" data-testid="input-quote-name" />
                {form.formState.errors.customerName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input {...form.register("customerEmail")} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="john@example.com" data-testid="input-quote-email" />
                {form.formState.errors.customerEmail && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerEmail.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input {...form.register("customerPhone")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="0400 000 000" data-testid="input-quote-phone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suburb <span className="text-red-500">*</span></label>
                <input {...form.register("suburb")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="Frankston" data-testid="input-quote-suburb" />
                {form.formState.errors.suburb && <p className="text-red-500 text-xs mt-1">{form.formState.errors.suburb.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type <span className="text-red-500">*</span></label>
              <select {...form.register("jobType")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="select-quote-job-type">
                <option value="">Select job type...</option>
                <option value="New Home Wiring">New Home Wiring</option>
                <option value="Renovation">Renovation</option>
                <option value="3-Phase Upgrade">3-Phase Upgrade</option>
                <option value="Underground Power">Underground Power</option>
                <option value="Switchboard Upgrade">Switchboard Upgrade</option>
                <option value="Commercial Wiring">Commercial Wiring</option>
                <option value="Other">Other</option>
              </select>
              {form.formState.errors.jobType && <p className="text-red-500 text-xs mt-1">{form.formState.errors.jobType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description <span className="text-red-500">*</span></label>
              <textarea {...form.register("description")} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="Describe what you need done in detail..." data-testid="input-quote-description" />
              {form.formState.errors.description && <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message}</p>}
            </div>

            {/* Photo URLs */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Upload size={16} className="text-[hsl(25,95%,53%)]" />
                <h3 className="font-semibold text-gray-800">Photo Links (Optional)</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Switchboard Photo URL</label>
                  <input {...form.register("switchboardImageUrl")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="https://drive.google.com/..." data-testid="input-quote-switchboard" />
                  {form.formState.errors.switchboardImageUrl && <p className="text-red-500 text-xs mt-1">{form.formState.errors.switchboardImageUrl.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fascia / Point of Attachment Photo URL</label>
                  <input {...form.register("fasciImageUrl")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="https://drive.google.com/..." data-testid="input-quote-fascia" />
                  {form.formState.errors.fasciImageUrl && <p className="text-red-500 text-xs mt-1">{form.formState.errors.fasciImageUrl.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Curb / Pit Area Photo URL</label>
                  <input {...form.register("streetImageUrl")} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" placeholder="https://drive.google.com/..." data-testid="input-quote-street" />
                  {form.formState.errors.streetImageUrl && <p className="text-red-500 text-xs mt-1">{form.formState.errors.streetImageUrl.message}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createQuote.isPending}
              className="w-full bg-[hsl(25,95%,53%)] text-white font-semibold py-3 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors disabled:opacity-60"
              data-testid="button-submit-quote"
            >
              {createQuote.isPending ? "Submitting..." : "Submit Quote Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
