import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Truck,
  X,
} from "lucide-react";
import Editable from "../../components/editable/Editable";
import {
  backendUrl,
  fetchWithAuth,
  readApiResponse,
  toAssetUrl,
} from "../../config/api";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "pickup_scheduled", label: "Pickup scheduled" },
  { value: "received", label: "Item received" },
  { value: "refunded", label: "Refunded" },
  { value: "rejected", label: "Rejected" },
];

const statusClasses = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  pickup_scheduled: "bg-purple-100 text-purple-800",
  received: "bg-indigo-100 text-indigo-800",
  refunded: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const getStatusLabel = (status) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label || status;

const normalizeReturn = (item = {}) => {
  const rawImage =
    item.proofImages?.[0] ||
    item.productSnapshot?.image ||
    item.product?.image ||
    "";

  return {
    id: item._id || item.id,
    returnNumber: item.returnNumber || item._id || "Return",
    orderId: item.order?._id || item.order || "",
    user: item.user?.email || "Unknown customer",
    productName: item.productSnapshot?.name || item.product?.name || "Product",
    quantity: Number(item.quantity) || 1,
    reason: item.reason || "No reason provided",
    details: item.details || "",
    status: item.status || "pending",
    date: item.createdAt,
    image: rawImage ? toAssetUrl(rawImage) : "",
    refundAmount: Number(item.refundAmount) || 0,
    adminNote: item.adminNote || "",
  };
};

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const loadReturns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (status !== "all") params.set("status", status);
      if (search) params.set("search", search);

      const response = await fetchWithAuth(
        `${backendUrl}/api/v1/admin/returns?${params.toString()}`,
      );
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed to fetch returns");

      setReturns((data.data || []).map(normalizeReturn));
      setPagination(data.pagination || { page, total: 0, totalPages: 1 });
    } catch (requestError) {
      setReturns([]);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReturns();
  }, [loadReturns]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeStatusFilter = (event) => {
    setPage(1);
    setStatus(event.target.value);
  };

  const handleStatusUpdate = async (returnRequest, nextStatus) => {
    setActionId(returnRequest.id);

    try {
      const response = await fetchWithAuth(
        `${backendUrl}/api/v1/admin/returns/${returnRequest.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed to update return status");

      if (status === "all") {
        setReturns((current) =>
          current.map((item) =>
            item.id === returnRequest.id ? normalizeReturn(data.data) : item,
          ),
        );
      } else {
        await loadReturns();
      }
    } catch {
      // API and network failures are presented by the shared error popup.
    } finally {
      setActionId("");
    }
  };

  const renderActions = (returnRequest) => {
    const working = actionId === returnRequest.id;

    if (returnRequest.status === "pending") {
      return (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleStatusUpdate(returnRequest, "approved")}
            disabled={working}
            className="w-full bg-brand text-white hover:bg-brand-dark px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
          >
            <Check size={16} /> {working ? "Updating..." : "Approve Return"}
          </button>
          <button
            type="button"
            onClick={() => handleStatusUpdate(returnRequest, "rejected")}
            disabled={working}
            className="w-full bg-white text-red-600 hover:bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-sm"
          >
            <X size={16} /> Reject Request
          </button>
        </div>
      );
    }

    if (returnRequest.status === "approved") {
      return (
        <button
          type="button"
          onClick={() => handleStatusUpdate(returnRequest, "pickup_scheduled")}
          disabled={working}
          className="w-full bg-purple-600 text-white hover:bg-purple-700 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
        >
          <Truck size={16} /> {working ? "Updating..." : "Schedule Pickup"}
        </button>
      );
    }

    if (returnRequest.status === "pickup_scheduled") {
      return (
        <button
          type="button"
          onClick={() => handleStatusUpdate(returnRequest, "received")}
          disabled={working}
          className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
        >
          <Box size={16} /> {working ? "Updating..." : "Mark as Received"}
        </button>
      );
    }

    if (returnRequest.status === "received") {
      return (
        <button
          type="button"
          onClick={() => handleStatusUpdate(returnRequest, "refunded")}
          disabled={working}
          className="w-full bg-green-600 text-white hover:bg-green-700 px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
        >
          <ArrowRight size={16} /> {working ? "Updating..." : "Process Refund"}
        </button>
      );
    }

    return <div className="text-center text-sm font-medium text-gray-500 py-3 bg-gray-100 rounded-xl border border-gray-200">Case Closed</div>;
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Editable
              as="h1"
              id="admin-returns-heading"
              kind="button"
              label="Returns Heading"
              className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3"
            >
              Returns & Refunds
            </Editable>
            <Editable
              as="p"
              id="admin-returns-sub"
              kind="button"
              label="Returns Subtext"
              className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed"
            >
              Manage customer return requests and track refund status smoothly.
            </Editable>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <form onSubmit={submitSearch} className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search return, order, email..."
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm transition-all"
              />
            </form>
            <select
              value={status}
              onChange={changeStatusFilter}
              className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm transition-all [&>option]:text-gray-900"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {loading ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-24 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          Loading return requests...
        </div>
      ) : error ? (
        <div className="bg-red-50/80 backdrop-blur-xl rounded-2xl shadow-xl border border-red-100 py-16 text-center text-red-600 font-medium">
          {error}
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-24 text-center">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
             <Box size={28} />
           </div>
           <p className="text-gray-500 text-base font-medium">No return requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {returns.map((returnRequest) => (
            <Editable
              key={returnRequest.id}
              as="div"
              kind="button"
              group="admin-return-card"
              label="Return Card Background"
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1 flex gap-6 min-w-0">
                  <div className="relative group shrink-0">
                    {returnRequest.image ? (
                      <img loading="lazy" src={returnRequest.image} alt="Return item" className="w-24 h-24 object-cover rounded-xl border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-gray-400 shadow-sm group-hover:scale-105 transition-transform duration-500">
                        <Box size={24} />
                        <span className="text-[10px] mt-2 font-medium">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 border border-black/5 rounded-xl pointer-events-none"></div>
                  </div>

                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{returnRequest.returnNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border border-transparent ${statusClasses[returnRequest.status] || "bg-gray-100 text-gray-800"}`}>
                        {getStatusLabel(returnRequest.status)}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-base mb-2">
                      {returnRequest.productName} <span className="text-gray-500 font-normal">x {returnRequest.quantity}</span>
                    </p>
                    <div className="text-sm text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5"><strong className="text-gray-700">Order:</strong> {returnRequest.orderId}</span>
                      <span className="flex items-center gap-1.5"><strong className="text-gray-700">Customer:</strong> <a href={`mailto:${returnRequest.user}`} className="text-brand hover:underline">{returnRequest.user}</a></span>
                      <span className="flex items-center gap-1.5"><strong className="text-gray-700">Requested:</strong> {new Date(returnRequest.date).toLocaleDateString("en-IN")}</span>
                    </div>
                    <div className="text-sm bg-red-50 text-red-800 border border-red-100 px-4 py-2 rounded-lg inline-block w-fit">
                      <span className="font-bold">Reason:</span> {returnRequest.reason}
                    </div>
                    {returnRequest.details && (
                      <p className="text-sm text-gray-600 mt-3 max-w-2xl leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{returnRequest.details}</p>
                    )}
                    {returnRequest.adminNote && (
                      <p className="text-sm text-amber-800 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium"><strong className="text-amber-900">Admin Note:</strong> {returnRequest.adminNote}</p>
                    )}
                  </div>
                </div>

                <div className="lg:w-72 shrink-0 flex flex-col gap-4 justify-center bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500 font-medium">Refund Amount</span>
                    <span className="font-black text-xl text-gray-900">
                      ₹{returnRequest.refundAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {renderActions(returnRequest)}
                </div>
              </div>
            </Editable>
          ))}
        </div>
      )}

      {!loading && !error && pagination.total > 0 && (
        <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 px-6 py-4 text-sm text-gray-600">
          <span className="text-center sm:text-left font-medium">
            Showing <span className="text-gray-900">{(pagination.page - 1) * 10 + 1}-{Math.min(pagination.page * 10, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span>
          </span>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.page <= 1}
              aria-label="Previous page"
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={pagination.page >= pagination.totalPages}
              aria-label="Next page"
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
