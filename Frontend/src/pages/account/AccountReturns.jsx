import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Undo2, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import Editable from "../../components/editable/Editable";
import { backendUrl, fetchWithAuth, readApiResponse, toAssetUrl } from "../../config/api";

const STATUS_LABELS = {
  pending: "Pending approval",
  approved: "Approved",
  pickup_scheduled: "Pickup scheduled",
  received: "Item received",
  refunded: "Refunded",
  rejected: "Rejected",
};

const isPositiveStatus = (status) => ["approved", "received", "refunded"].includes(status);

const normalizeReturn = (item = {}) => ({
  id: item._id || item.id,
  returnNumber: item.returnNumber || item._id || "Return",
  orderId: item.order?._id || item.order || "",
  status: item.status || "pending",
  requestDate: item.createdAt || new Date().toISOString(),
  refundAmount: Number(item.refundAmount) || 0,
  item: {
    name: item.productSnapshot?.name || item.product?.name || "Product",
    image: toAssetUrl(item.productSnapshot?.image || item.product?.image || ""),
  },
});

export default function AccountReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadReturns = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchWithAuth(`${backendUrl}/api/v1/returns/my`);
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.message || "Failed to fetch returns");

        if (!ignore) setReturns((data.data || []).map(normalizeReturn));
      } catch (requestError) {
        if (!ignore) {
          setReturns([]);
          setError(requestError.message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadReturns();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <Editable as="div" kind="button" id="returns-loading-card" label="Returns Loading Card" className="bg-white rounded-md shadow-card py-16 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-brand" />
        <p className="text-gray-600">Loading returns...</p>
      </Editable>
    );
  }

  if (error) {
    return (
      <Editable as="div" kind="button" id="returns-error-card" label="Returns Error Card" className="bg-red-50 rounded-md shadow-card py-12 px-6 text-center">
        <p className="font-medium text-red-600">{error}</p>
      </Editable>
    );
  }

  if (returns.length === 0) {
    return (
      <Editable as="div" kind="button" id="returns-empty-card" label="Returns Empty Card" className="bg-white rounded-md shadow-card py-16 flex flex-col items-center gap-3">
        <Undo2 size={44} className="text-gray-300" />
        <p className="text-gray-600">You have no active or past returns.</p>
        <Link to="/account/orders" className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm mt-2">View Orders</Link>
      </Editable>
    );
  }

  return (
    <Editable as="div" kind="button" id="returns-main-card" label="Returns Main Card Background" className="bg-white rounded-md shadow-card p-4 sm:p-6">
      <Editable as="h1" id="returns-heading" label="Returns Page Heading" className="font-display font-semibold text-xl text-gray-900 mb-6">
        My Returns
      </Editable>

      <div className="flex flex-col gap-4">
        {returns.map((ret) => (
          <Editable key={ret.id} as="div" kind="button" group="return-card" label="Return Card Background" className="border border-gray-200 rounded-md p-4 hover:border-brand/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-4 items-center">
                <img loading="lazy" src={ret.item.image} alt={ret.item.name} className="w-16 h-16 rounded object-cover border border-gray-100" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{ret.item.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Return ID: {ret.returnNumber} - Order: {ret.orderId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Requested on: {new Date(ret.requestDate).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm w-fit ${isPositiveStatus(ret.status) ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {isPositiveStatus(ret.status) ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {STATUS_LABELS[ret.status] || ret.status}
                </div>
                <p className="text-sm font-semibold text-gray-900">Refund: Rs {ret.refundAmount.toLocaleString("en-IN")}</p>
                <Link to={`/account/returns/${ret.id}`} className="text-xs font-medium text-brand hover:underline flex items-center gap-1 mt-1">
                  View Status <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </Editable>
        ))}
      </div>
    </Editable>
  );
}
