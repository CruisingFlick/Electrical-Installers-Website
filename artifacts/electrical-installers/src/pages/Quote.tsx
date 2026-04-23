import { useCreateQuote } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Camera, ImagePlus, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";

const quoteSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().optional(),
  suburb: z.string().min(2, "Suburb is required"),
  jobType: z.string().min(2, "Job type is required"),
  description: z.string().min(20, "Please describe the job in more detail"),
  switchboardImageUrl: z.string().optional(),
  fasciImageUrl: z.string().optional(),
  streetImageUrl: z.string().optional(),
});
type QuoteForm = z.infer<typeof quoteSchema>;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface PhotoUploadZoneProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  testId?: string;
}

function PhotoUploadZone({ label, hint, value, onChange, testId }: PhotoUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await fileToBase64(file);
    onChange(dataUrl);
  }, [onChange]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img
            src={value}
            alt={label}
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={clear}
              className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all p-6 text-center ${
            dragging
              ? "border-[hsl(25,95%,53%)] bg-[hsl(25,95%,53%)]/5 scale-[1.01]"
              : "border-gray-200 hover:border-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,53%)]/5"
          }`}
          data-testid={testId}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ImagePlus size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {dragging ? "Drop your photo here" : "Drag & drop a photo here"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">or click to browse files</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
              className="mt-1 flex items-center gap-1.5 text-xs text-[hsl(25,95%,53%)] font-medium border border-[hsl(25,95%,53%)]/30 px-3 py-1.5 rounded-lg hover:bg-[hsl(25,95%,53%)]/10 transition-colors"
            >
              <Camera size={13} /> Take a Photo
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}

export default function QuotePage() {
  const createQuote = useCreateQuote();
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState({ switchboard: "", fasci: "", street: "" });

  const form = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customerName: "", customerEmail: "", customerPhone: "",
      suburb: "", jobType: "", description: "",
      switchboardImageUrl: "", fasciImageUrl: "", streetImageUrl: "",
    },
  });

  async function onSubmit(data: QuoteForm) {
    await createQuote.mutateAsync({
      data: {
        ...data,
        switchboardImageUrl: photos.switchboard || undefined,
        fasciImageUrl: photos.fasci || undefined,
        streetImageUrl: photos.street || undefined,
      }
    }, {
      onSuccess: () => setSubmitted(true),
    });
  }

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Virtual Quote Request</h1>
          <p className="text-gray-300 text-lg">Fill in your details and upload photos — we'll get back to you with a quote.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {submitted ? (
          <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-100">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Quote Request Received!</h2>
            <p className="text-gray-600 mt-2">Thank you for contacting us! We'll review your details and be in touch shortly.</p>
            <button
              onClick={() => { setSubmitted(false); form.reset(); setPhotos({ switchboard: "", fasci: "", street: "" }); }}
              className="mt-6 text-[hsl(25,95%,53%)] underline text-sm"
              data-testid="button-quote-again"
            >
              Submit another quote
            </button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  {...form.register("customerName")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                  placeholder="John Smith"
                  data-testid="input-quote-name"
                />
                {form.formState.errors.customerName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  {...form.register("customerEmail")}
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                  placeholder="john@example.com"
                  data-testid="input-quote-email"
                />
                {form.formState.errors.customerEmail && <p className="text-red-500 text-xs mt-1">{form.formState.errors.customerEmail.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  {...form.register("customerPhone")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                  placeholder="0400 000 000"
                  data-testid="input-quote-phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suburb <span className="text-red-500">*</span></label>
                <input
                  {...form.register("suburb")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                  placeholder="Frankston"
                  data-testid="input-quote-suburb"
                />
                {form.formState.errors.suburb && <p className="text-red-500 text-xs mt-1">{form.formState.errors.suburb.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type <span className="text-red-500">*</span></label>
              <select
                {...form.register("jobType")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                data-testid="select-quote-job-type"
              >
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
              <textarea
                {...form.register("description")}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
                placeholder="Describe what you need done in detail..."
                data-testid="input-quote-description"
              />
              {form.formState.errors.description && <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message}</p>}
            </div>

            {/* Photo uploads */}
            <div className="border-t border-gray-100 pt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Photos <span className="font-normal text-gray-400 text-sm">(optional)</span></h3>
                <p className="text-xs text-gray-500">Drag &amp; drop, browse, or tap "Take a Photo" to use your camera. Better photos help us give you a more accurate quote.</p>
              </div>

              <PhotoUploadZone
                label="Switchboard"
                hint="A photo of your existing switchboard / meter box."
                value={photos.switchboard}
                onChange={(v) => setPhotos(p => ({ ...p, switchboard: v }))}
                testId="upload-zone-switchboard"
              />

              <PhotoUploadZone
                label="Fascia / Point of Attachment"
                hint="Where the overhead power cable connects to your house (under the eaves)."
                value={photos.fasci}
                onChange={(v) => setPhotos(p => ({ ...p, fasci: v }))}
                testId="upload-zone-fascia"
              />

              <PhotoUploadZone
                label="Street Curb / Pit Area"
                hint="The area near the street where the underground pit would be (for underground power jobs)."
                value={photos.street}
                onChange={(v) => setPhotos(p => ({ ...p, street: v }))}
                testId="upload-zone-street"
              />
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
