import { useGetAnalyticsSummary, useGetBookingsByService, useGetBookingsByRegion, useListBookings } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Calendar, Star, FileText, Image, TrendingUp, MapPin } from "lucide-react";
import AdminLayout from "./AdminLayout";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-[hsl(214,60%,14%)]">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetAnalyticsSummary();
  const { data: byService = [] } = useGetBookingsByService();
  const { data: byRegion = [] } = useGetBookingsByRegion();
  const { data: bookings = [] } = useListBookings({ status: "pending" });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Business overview and analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Total Bookings" value={summary?.totalBookings ?? 0} color="bg-[hsl(214,60%,30%)]" />
          <StatCard icon={TrendingUp} label="Pending Bookings" value={summary?.pendingBookings ?? 0} color="bg-[hsl(25,95%,53%)]" />
          <StatCard icon={FileText} label="Quote Requests" value={summary?.totalQuotes ?? 0} color="bg-[hsl(214,40%,50%)]" />
          <StatCard icon={Star} label="Pending Reviews" value={summary?.pendingReviews ?? 0} color="bg-[hsl(25,70%,40%)]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatCard icon={Image} label="Portfolio Items" value={summary?.totalPortfolioItems ?? 0} color="bg-[hsl(214,60%,30%)]" />
          <StatCard icon={MapPin} label="Top Region" value={summary?.topRegion ?? "N/A"} color="bg-[hsl(25,95%,53%)]" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-[hsl(214,60%,14%)] mb-4">Bookings by Service</h3>
            {byService.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byService} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="service" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(214,60%,30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-[hsl(214,60%,14%)] mb-4">Bookings by Region</h3>
            {byRegion.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byRegion} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(25,95%,53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Recent pending bookings */}
        {bookings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[hsl(214,60%,14%)]">Pending Bookings</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between" data-testid={`pending-booking-${b.id}`}>
                  <div>
                    <p className="font-medium text-sm text-[hsl(214,60%,14%)]">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.suburb} &bull; {b.jobType} &bull; {b.preferredDate}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
