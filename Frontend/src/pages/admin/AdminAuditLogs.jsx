import { useEffect, useMemo, useState } from "react";
import { Activity, Clock, UserCog, Edit3, Trash2, Search, ShieldAlert } from "lucide-react";
import Editable from "../../components/editable/Editable";
import { backendUrl, fetchWithAuth, readApiResponse } from "../../config/api";

const actionMeta = {
  BLOCK_USER: { icon: ShieldAlert, color: "text-red-600 bg-red-50" },
  UNBLOCK_USER: { icon: UserCog, color: "text-green-600 bg-green-50" },
  DELETE_COUPON: { icon: Trash2, color: "text-red-600 bg-red-50" },
  UPDATE_ORDER: { icon: Edit3, color: "text-blue-600 bg-blue-50" },
};

const getLogMeta = (action = "") =>
  actionMeta[action] || { icon: Activity, color: "text-purple-600 bg-purple-50" };

const formatRelativeTime = (dateValue) => {
  const timestamp = new Date(dateValue).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const normalizeLog = (log = {}) => ({
  id: log._id || log.id,
  action: log.action || "ACTION",
  module: log.module || "",
  details: log.description || "",
  targetName: log.targetName || "",
  adminEmail: log.admin?.email || "Admin",
  adminRole: log.admin?.role || "",
  createdAt: log.createdAt || new Date().toISOString(),
});

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [moduleName, setModuleName] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const actionOptions = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((log) => log.action)))],
    [logs],
  );
  const moduleOptions = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((log) => log.module).filter(Boolean)))],
    [logs],
  );

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (action !== "all") params.set("action", action);
      if (moduleName !== "all") params.set("module", moduleName);

      const query = params.toString();
      const res = await fetchWithAuth(
        `${backendUrl}/api/v1/admin/audit-logs${query ? `?${query}` : ""}`,
      );
      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch audit logs");
      }

      setLogs((data.data || data.logs || []).map(normalizeLog));
    } catch (err) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadLogs();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [search, action, moduleName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadLogs();
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10">
          <Editable as="h1" id="admin-audit-heading" kind="button" label="Audit Logs Heading" className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
            <Activity size={36} className="text-amber-400" />
            Admin Activity Logs
          </Editable>
          <Editable as="p" id="admin-audit-sub" kind="button" label="Audit Logs Subtext" className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
            Track critical administrative actions performed in the dashboard in real-time.
          </Editable>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute top-10 right-20 w-20 h-20 bg-amber-400/20 blur-2xl rounded-full pointer-events-none"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-5 grid gap-4 lg:grid-cols-[1fr_200px_200px]">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search action, user, target, or detail"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300"
          />
        </form>

        <div className="relative">
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 font-medium text-gray-700"
          >
            {actionOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All actions" : item}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={moduleName}
            onChange={(event) => setModuleName(event.target.value)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 font-medium text-gray-700"
          >
            {moduleOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All modules" : item}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <Editable as="div" kind="button" id="admin-audit-container" label="Audit Logs Background" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none mix-blend-multiply"></div>
        {loading ? (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-brand rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading audit logs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600 font-medium bg-red-50/50 rounded-xl">
            <div className="flex flex-col items-center justify-center gap-2">
              <ShieldAlert size={32} className="text-red-400" />
              {error}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
              <Search size={36} />
            </div>
            <p className="text-gray-500 text-base font-medium">No audit logs found matching your criteria.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-100/50 ml-4 pl-8 space-y-10 py-2">
            {currentLogs.map((log) => {
              const meta = getLogMeta(log.action);
              const Icon = meta.icon;

              return (
                <div key={log.id} className="relative group">
                  <div className={`absolute -left-[49px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${meta.color}`}>
                    <Icon size={16} />
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm group-hover:shadow-md group-hover:border-indigo-100 transition-all group-hover:-translate-y-0.5">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Editable as="span" group="admin-log-action" kind="button" label="Log Action" className="font-bold text-sm text-gray-900 group-hover:text-brand transition-colors">
                        {log.action}
                      </Editable>
                      {log.module && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-gray-600">
                          {log.module}
                        </span>
                      )}
                      <span className="text-gray-200">|</span>
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <Clock size={12} className="text-gray-400" /> {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                    <Editable as="p" group="admin-log-details" kind="button" label="Log Details" className="text-sm text-gray-700 leading-relaxed">
                      {log.details}
                    </Editable>
                    <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Performed by:</span> 
                        <span className="font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{log.adminEmail}</span>
                      </div>
                      {log.targetName && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400">Target:</span> 
                          <span className="font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{log.targetName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && logs.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
            <span className="text-sm text-gray-500">
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, logs.length)}</span> of <span className="font-bold text-gray-900">{logs.length}</span> logs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              <div className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold bg-gray-50 shadow-sm">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Editable>
    </div>
  );
}
