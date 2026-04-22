import { useState, useEffect } from "react";
import { useListJobs, useCreateJob, useUpdateJobStatus, useDeleteJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, X, Trash2, Navigation } from "lucide-react";
import AdminLayout from "./AdminLayout";

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createColoredIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

function getPinColor(status: string): string {
  switch (status) {
    case "pending": return "#f97316"; // orange
    case "accepted": return "#22c55e"; // green
    case "in_progress": return "#16a34a"; // darker green
    case "completed": return "#15803d"; // darkest green
    default: return "#f97316";
  }
}

const CENTER: [number, number] = [-38.23, 145.04];

interface JobForm {
  customerName: string;
  address: string;
  suburb: string;
  jobType: string;
  latitude: string;
  longitude: string;
  scheduledDate: string;
  notes: string;
}

export default function AdminJobMap() {
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading } = useListJobs();
  const updateStatus = useUpdateJobStatus();
  const del = useDeleteJob();
  const create = useCreateJob();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<JobForm>({ customerName: "", address: "", suburb: "", jobType: "", latitude: "", longitude: "", scheduledDate: "", notes: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      data: {
        customerName: form.customerName,
        address: form.address,
        suburb: form.suburb,
        jobType: form.jobType,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        scheduledDate: form.scheduledDate || undefined,
        notes: form.notes || undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setShowForm(false);
        setForm({ customerName: "", address: "", suburb: "", jobType: "", latitude: "", longitude: "", scheduledDate: "", notes: "" });
      },
    });
  }

  function handleStatusChange(id: number, status: string) {
    updateStatus.mutate({ id, data: { status: status as "pending" | "accepted" | "in_progress" | "completed" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() }),
    });
  }

  function handleDelete(id: number) {
    if (confirm("Remove this job?")) {
      del.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() }) });
    }
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Job Map</h1>
            <p className="text-sm text-gray-500 mt-0.5">Orange = pending/pre-approved &bull; Green = accepted/in progress/completed</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(25,95%,45%)] transition-colors"
            data-testid="button-add-job"
          >
            <Plus size={16} /> Add Job
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow" />
            <span className="text-gray-600">Pending / Pre-approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
            <span className="text-gray-600">Accepted / In Progress / Completed</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: "520px" }}>
          {!isLoading && (
            <MapContainer center={CENTER} zoom={10} style={{ width: "100%", height: "100%" }} data-testid="job-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {jobs.map((job) => (
                <Marker
                  key={job.id}
                  position={[job.latitude, job.longitude]}
                  icon={createColoredIcon(getPinColor(job.status))}
                >
                  <Popup>
                    <div className="text-sm min-w-[200px]">
                      <p className="font-bold text-[hsl(214,60%,14%)] mb-1">{job.customerName}</p>
                      <p className="text-gray-600 mb-0.5">{job.address}, {job.suburb}</p>
                      <p className="text-gray-600 mb-0.5">{job.jobType}</p>
                      {job.scheduledDate && <p className="text-gray-500 text-xs mb-1">Scheduled: {job.scheduledDate}</p>}
                      {job.notes && <p className="text-gray-500 text-xs mb-2">Notes: {job.notes}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 flex-1"
                          data-testid={`job-status-${job.id}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <a
                          href={`https://maps.google.com/?q=${job.latitude},${job.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[hsl(25,95%,53%)] hover:underline"
                        >
                          <Navigation size={12} /> Navigate
                        </a>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-auto"
                          data-testid={`button-delete-job-${job.id}`}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Add job modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-semibold text-[hsl(214,60%,14%)]">Add Job to Map</h2>
                <button onClick={() => setShowForm(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input name="customerName" value={form.customerName} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-job-customer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                    <select name="jobType" value={form.jobType} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="select-job-type">
                      <option value="">Select...</option>
                      <option value="New Home Wiring">New Home Wiring</option>
                      <option value="Renovation">Renovation</option>
                      <option value="3-Phase Upgrade">3-Phase Upgrade</option>
                      <option value="Underground Power">Underground Power</option>
                      <option value="Switchboard Upgrade">Switchboard Upgrade</option>
                      <option value="Commercial Wiring">Commercial Wiring</option>
                      <option value="Fault Finding">Fault Finding</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input name="address" value={form.address} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-job-address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suburb *</label>
                  <input name="suburb" value={form.suburb} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-job-suburb" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude * <span className="text-xs text-gray-400">(e.g. -38.14)</span></label>
                    <input name="latitude" value={form.latitude} onChange={handleChange} required type="number" step="any" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-job-lat" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude * <span className="text-xs text-gray-400">(e.g. 145.12)</span></label>
                    <input name="longitude" value={form.longitude} onChange={handleChange} required type="number" step="any" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-job-lng" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input name="scheduledDate" value={form.scheduledDate} onChange={handleChange} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-job-date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-job-notes" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={create.isPending} className="flex-1 bg-[hsl(25,95%,53%)] text-white font-medium py-2 rounded-lg text-sm hover:bg-[hsl(25,95%,45%)] disabled:opacity-60" data-testid="button-save-job">
                    {create.isPending ? "Adding..." : "Add to Map"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2 rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
