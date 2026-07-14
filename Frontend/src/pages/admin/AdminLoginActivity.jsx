import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Laptop,
  MapPin,
  MonitorSmartphone,
  Search,
} from "lucide-react";
import Editable from "../../components/editable/Editable";
import { backendUrl, fetchWithAuth, readApiResponse } from "../../config/api";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

const getLocation = (location = {}) =>
  [location.city, location.region, location.country].filter(Boolean).join(", ") ||
  "Unavailable";

export default function AdminLoginActivity() {
  const [activities, setActivities] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);

      const response = await fetchWithAuth(
        `${backendUrl}/api/v1/admin/login-activities?${params.toString()}`,
      );
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch login activity");
      }

      setActivities(data.data || []);
      setPagination(data.pagination || { page, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivities();
  }, [loadActivities]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeStatus = (event) => {
    setPage(1);
    setStatus(event.target.value);
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10">
          <Editable
            as="h1"
            id="admin-login-activity-heading"
            kind="button"
            label="Login Activity Heading"
            className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3"
          >
            <Clock3 size={36} className="text-amber-400" />
            Login Activity
          </Editable>
          <p className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
            Review account sign-ins, devices, locations, and active sessions.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute top-10 right-20 w-20 h-20 bg-amber-400/20 blur-2xl rounded-full pointer-events-none"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-5 flex flex-col md:flex-row gap-4">
        <form onSubmit={submitSearch} className="relative flex-1 group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search email, IP, browser, device, or location"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300"
          />
        </form>
        <div className="relative w-full md:w-56 shrink-0">
          <select
            value={status}
            onChange={changeStatus}
            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 font-medium text-gray-700"
          >
            <option value="all">All sessions</option>
            <option value="active">Active</option>
            <option value="ended">Logged out</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1080px]">
            <thead>
              <tr className="text-left bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">S.No.</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">User</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Device</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">IP Address</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Location</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Login Time</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Logout Time</th>
                <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan="8" className="py-12 text-center text-gray-500">
                  Loading login activity...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan="8" className="py-12 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && activities.length === 0 && (
              <tr>
                <td colSpan="8" className="py-12 text-center text-gray-500">
                  No login activity found.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              activities.map((activity, index) => (
                <tr
                  key={activity._id}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  <td className="py-5 px-6 text-gray-500 font-medium">
                    {(pagination.page - 1) * 10 + index + 1}
                  </td>
                  <td className="py-5 px-6">
                    <div className="font-bold text-gray-900 group-hover:text-brand transition-colors">
                      {activity.userId?.email || "Deleted user"}
                    </div>
                    <div className="text-xs text-gray-500 capitalize mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded-md">
                      {activity.userId?.role || "unknown"}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <div className="p-1.5 bg-indigo-50 rounded-md text-brand">
                        <MonitorSmartphone size={14} />
                      </div>
                      {activity.device || "Unknown"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                      <Laptop size={12} className="text-gray-400" />
                      {activity.browser || "Unknown"} / {activity.operatingSystem || "Unknown"}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-gray-600 font-mono text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-md">
                      {activity.ipAddress || "Unknown"}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="flex items-center gap-2 text-gray-600 font-medium">
                      <MapPin size={14} className="text-gray-400" />
                      {getLocation(activity.location)}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs text-gray-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock3 size={14} className="text-brand" />
                      {formatDateTime(activity.loginAt)}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs text-gray-600 font-medium">
                    {formatDateTime(activity.logoutAt)}
                  </td>
                  <td className="py-5 px-6">
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-md text-xs font-bold border ${
                        activity.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {activity.isActive ? "Active" : "Logged out"}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>

        {!loading && !error && pagination.total > 0 && (
          <div className="p-6 border-t border-gray-100 bg-white/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-bold text-gray-900">{(pagination.page - 1) * 10 + 1}</span> to{" "}
              <span className="font-bold text-gray-900">{Math.min(pagination.page * 10, pagination.total)}</span> of <span className="font-bold text-gray-900">{pagination.total}</span> entries
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              <div className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold bg-gray-50 shadow-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(current + 1, pagination.totalPages))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
