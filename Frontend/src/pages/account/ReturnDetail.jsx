import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Truck, Box, Wallet, Clock, XCircle } from "lucide-react";
import Editable from "../../components/editable/Editable";
import { backendUrl, fetchWithAuth, readApiResponse, toAssetUrl } from "../../config/api";

const STEPS = [
  { key: "pending", label: "Return Requested", icon: Clock, desc: "Return request submitted and waiting for admin approval." },
  { key: "approved", label: "Return Approved", icon: CheckCircle2, desc: "Admin has approved your return request." },
  { key: "pickup_scheduled", label: "Pickup Scheduled", icon: Truck, desc: "Courier pickup has been scheduled." },
  { key: "received", label: "Item Received", icon: Box, desc: "Item received at our warehouse." },
  { key: "refunded", label: "Refund Issued", icon: Wallet, desc: "Refund has been processed." },
];

const normalizeReturn = (item = {}) => ({
  id: item._id || item.id,
  returnNumber: item.returnNumber || item._id || "Return",
  orderId: item.order?._id || item.order || "",
  status: item.status || "pending",
  refundAmount: Number(item.refundAmount) || 0,
  refundMethod: item.order?.paymentMethod === "cod" ? "UPI or bank transfer after approval" : "Original payment source",
  adminNote: item.adminNote || "",
  item: {
    name: item.productSnapshot?.name || item.product?.name || "Product",
    qty: Number(item.quantity) || 1,
    price: Number(item.productSnapshot?.price) || Number(item.refundAmount) || 0,
    image: toAssetUrl(item.productSnapshot?.image || item.product?.image || ""),
  },
});

export default function ReturnDetail() {
  const { returnId } = useParams();
  const [ret, setRet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadReturn = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchWithAuth(`${backendUrl}/api/v1/returns/${returnId}`);
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.message || "Failed to fetch return");

        if (!ignore) setRet(normalizeReturn(data.data));
      } catch (requestError) {
        if (!ignore) {
          setRet(null);
          setError(requestError.message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadReturn();

    return () => {
      ignore = true;
    };
  }, [returnId]);

  if (loading) {
    return (
      <Editable as="div" kind="button" id="return-detail-loading-card" label="Return Detail Loading Card" className="bg-white rounded-md shadow-card py-16 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-brand" />
        <p className="text-gray-600">Loading return details...</p>
      </Editable>
    );
  }

  if (error || !ret) {
    return <div className="text-center py-10 text-gray-500">{error || "Return not found."}</div>;
  }

  const activeIdx = ret.status === "rejected"
    ? 0
    : Math.max(STEPS.findIndex((step) => step.key === ret.status), 0);

  return (
    <div className="flex flex-col gap-6">
      <Link to="/account/returns" className="text-sm font-medium text-gray-500 hover:text-brand flex items-center gap-1 w-fit">
        <ChevronLeft size={16} /> Back to Returns
      </Link>

      <div>
        <Editable as="h1" id="return-detail-heading" label="Return Detail Heading" className="text-xl font-semibold text-gray-900">
          Return #{ret.returnNumber}
        </Editable>
        <p className="text-sm text-gray-500 mt-1">Order ID: {ret.orderId}</p>
      </div>

      {ret.status === "rejected" && (
        <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 text-red-700">
          <XCircle size={22} />
          <div>
            <p className="font-semibold">Return rejected</p>
            <p className="text-sm">{ret.adminNote || "Your return request was not approved."}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Editable as="div" kind="button" id="return-timeline-card" label="Return Timeline Card" className="bg-white rounded-md shadow-card p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Return Status</h2>
          <div className="relative pl-4">
            <div className="absolute left-[1.35rem] top-4 bottom-4 w-0.5 bg-gray-100" />
            <div className="flex flex-col gap-6 relative">
              {STEPS.map((step, index) => {
                const done = ret.status !== "rejected" && index <= activeIdx;
                const isCurrent = ret.status !== "rejected" && index === activeIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className={`flex gap-4 ${!done && "opacity-40"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 bg-white relative z-10 transition-colors ${done ? "border-brand text-brand" : "border-gray-300 text-gray-400"} ${isCurrent && "bg-brand/10"}`}>
                      <Icon size={14} />
                    </div>
                    <div className="pt-1.5">
                      <h3 className={`font-semibold text-sm ${done ? "text-gray-900" : "text-gray-500"}`}>{step.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Editable>

        <div className="flex flex-col gap-6">
          <Editable as="div" kind="button" id="return-item-card" label="Return Item Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Item Details</h2>
            <div className="flex gap-4">
              <img loading="lazy" src={ret.item.image} alt={ret.item.name} className="w-16 h-16 rounded object-cover border border-gray-100" />
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{ret.item.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Qty: {ret.item.qty}</p>
                <p className="font-semibold text-gray-900 text-sm mt-2">Rs {ret.item.price.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </Editable>

          <Editable as="div" kind="button" id="return-refund-card" label="Refund Info Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Refund Information</h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Refund Amount</span>
                <span className="font-semibold text-gray-900">Rs {ret.refundAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Refund Method</span>
                <span className="text-sm font-medium text-gray-900 text-right">{ret.refundMethod}</span>
              </div>
            </div>
            {ret.status === "refunded" && (
              <p className="text-xs text-green-700 bg-green-50 mt-4 p-3 rounded">
                The refund has been successfully processed. It may take 3-5 business days to reflect in your account.
              </p>
            )}
          </Editable>
        </div>
      </div>
    </div>
  );
}
