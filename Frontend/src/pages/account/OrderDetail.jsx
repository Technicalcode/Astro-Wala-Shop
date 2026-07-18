import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { cancelOrder, fetchMyOrders, selectOrdersForUser } from "../../store/ordersSlice";
import { selectUser } from "../../store/authSlice";
import { ChevronLeft, Download, XCircle, Undo2, CheckCircle2, Truck, PackageCheck, FileText } from "lucide-react";
import Editable from "../../components/editable/Editable";
import { showErrorPopup, showInfoPopup } from "../../utils/notificationCenter";
import { backendUrl, fetchWithAuth, readApiResponse } from "../../config/api";

const STEPS = [
  { key: "Confirmed", label: "Order Confirmed", icon: CheckCircle2, desc: "Your order has been placed successfully." },
  { key: "Packed", label: "Packed", icon: FileText, desc: "Seller is preparing your package." },
  { key: "Shipped", label: "Shipped", icon: Truck, desc: "Package is on the way." },
  { key: "Out For Delivery", label: "Out For Delivery", icon: Truck, desc: "Package is with the delivery partner." },
  { key: "Delivered", label: "Delivered", icon: PackageCheck, desc: "Package delivered to your address." },
];

const getDeliveryDate = (placedAt) => {
  return new Date(new Date(placedAt).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getReturnOrderId = (returnRequest) =>
  String(returnRequest?.order?._id || returnRequest?.order || "");

const getReturnProductId = (returnRequest) =>
  String(returnRequest?.product?._id || returnRequest?.product || "");

const getReturnProductName = (returnRequest) =>
  returnRequest?.productSnapshot?.name || returnRequest?.product?.name || "this item";

const RETURN_STATUS_NOTICES = {
  approved: {
    title: "Return accepted",
    message: (name) => `${name} return request has been accepted successfully.`,
  },
  pickup_scheduled: {
    title: "Return pickup scheduled",
    message: (name) => `Courier pickup has been scheduled for ${name}. Please keep the return item ready for the shipper.`,
  },
  received: {
    title: "Return item received",
    message: (name) => `${name} has been received by the seller team. Refund processing will start soon.`,
  },
  refunded: {
    title: "Refund processed",
    message: (name) => `${name} refund has been processed successfully.`,
  },
};

const RETURN_BUTTON_LABELS = {
  pending: "Return Requested",
  approved: "Return Accepted",
  pickup_scheduled: "Pickup Scheduled",
  received: "Item Received",
  refunded: "Refund Processed",
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const orders = useSelector(user ? selectOrdersForUser(user.email) : () => []);
  const order = orders.find(o => o.id === orderId);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnForm, setReturnForm] = useState({
    productId: "",
    quantity: 1,
    reason: "Product no longer required",
    details: "",
  });

  useEffect(() => {
    if (user) dispatch(fetchMyOrders());
  }, [dispatch, user]);

  useEffect(() => {
    if (!user || !order?.id) return undefined;

    let ignore = false;

    const loadReturnRequests = async () => {
      try {
        const response = await fetchWithAuth(`${backendUrl}/api/v1/returns/my`);
        const data = await readApiResponse(response);
        if (!response.ok) return;

        const currentOrderReturns = (data.data || []).filter(
          (returnRequest) => getReturnOrderId(returnRequest) === String(order.id),
        );

        if (!ignore) setReturnRequests(currentOrderReturns);

        currentOrderReturns
          .filter((returnRequest) =>
            ["approved", "pickup_scheduled", "received", "refunded", "rejected"].includes(returnRequest.status),
          )
          .forEach((returnRequest) => {
            const noticeKey = `return-${returnRequest.status}-notice:${returnRequest._id || returnRequest.id}`;
            if (sessionStorage.getItem(noticeKey)) return;

            sessionStorage.setItem(noticeKey, "shown");
            if (returnRequest.status === "rejected") {
              showErrorPopup(
                `${getReturnProductName(returnRequest)} return request was rejected.${returnRequest.adminNote ? ` Reason: ${returnRequest.adminNote}` : ""}`,
                { title: "Return request rejected" },
              );
            } else {
              const notice = RETURN_STATUS_NOTICES[returnRequest.status];
              showInfoPopup(
                notice.message(getReturnProductName(returnRequest)),
                { title: notice.title },
              );
            }
          });
      } catch {
        // Shared API handler already shows network errors where needed.
      }
    };

    loadReturnRequests();
    const interval = window.setInterval(loadReturnRequests, 30000);
    window.addEventListener("focus", loadReturnRequests);

    return () => {
      ignore = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadReturnRequests);
    };
  }, [order?.id, user]);

  if (!order) {
    return <div className="text-center py-10 text-gray-500">Order not found.</div>;
  }

  const isCancelled = order.status === "Cancelled";
  
  const displayStatus = order.status;
  const activeIdx = STEPS.findIndex((s) => s.key === displayStatus);
  const canCancel = ["Pending", "Confirmed"].includes(order.status);
  const canDownloadInvoice = order.status === "Delivered";
  const primaryProductPath = order.items?.[0]?.id ? `/product/${order.items[0].id}` : null;
  const latestActiveReturn = returnRequests.find((returnRequest) =>
    ["refunded", "received", "pickup_scheduled", "approved", "pending"].includes(returnRequest.status),
  );
  const rejectedReturn = returnRequests.find((returnRequest) => returnRequest.status === "rejected");
  const pendingReturn = returnRequests.find((returnRequest) =>
    ["pending", "approved", "pickup_scheduled", "received", "refunded"].includes(returnRequest.status),
  );

  const handleCancel = async () => {
    setIsCancelling(true);
    const result = await dispatch(cancelOrder(order.id));
    setIsCancelling(false);

    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Order could not be cancelled.", {
        title: "Cancellation failed",
      });
      return;
    }
    setShowCancelDialog(false);
    showInfoPopup("Your order has been cancelled.", { title: "Order cancelled" });
  };

  const handleInvoiceDownload = async () => {
    try {
      setIsDownloadingInvoice(true);
      const { downloadInvoicePdf } = await import("../../utils/invoicePdf");
      downloadInvoicePdf(order);
    } catch {
      showErrorPopup("Invoice could not be downloaded. Please try again.", {
        title: "Download failed",
      });
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const openReturnDialog = () => {
    const returnedProductIds = new Set(returnRequests.map(getReturnProductId));
    const firstItem =
      order.items?.find((item) => !returnedProductIds.has(String(item.id))) ||
      order.items?.[0];
    setReturnForm({
      productId: firstItem?.id || "",
      quantity: 1,
      reason: "Product no longer required",
      details: "",
    });
    setShowReturnDialog(true);
  };

  const selectedReturnItem = order.items.find((item) => item.id === returnForm.productId);

  const handleReturnSubmit = async (event) => {
    event.preventDefault();

    if (!returnForm.productId) {
      showErrorPopup("Please select an item to return.", { title: "Return item required" });
      return;
    }

    try {
      setIsSubmittingReturn(true);
      const response = await fetchWithAuth(`${backendUrl}/api/v1/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          productId: returnForm.productId,
          quantity: Number(returnForm.quantity) || 1,
          reason: returnForm.reason,
          details: returnForm.details,
        }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Return request could not be submitted.");
      }

      setShowReturnDialog(false);
      showInfoPopup("Your return request has been submitted and is now visible to admin.", {
        title: "Return requested",
      });
    } catch (error) {
      showErrorPopup(error.message || "Return request could not be submitted.", {
        title: "Return request failed",
      });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/account/orders" className="text-sm font-medium text-gray-500 hover:text-brand flex items-center gap-1 w-fit">
        <ChevronLeft size={16} /> Back to Orders
      </Link>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Editable
            as={primaryProductPath ? Link : "h1"}
            to={primaryProductPath || undefined}
            id="order-detail-heading"
            label="Order Detail Heading"
            className="block text-xl font-semibold text-gray-900 hover:text-brand hover:underline"
          >
            Order #{order.id}
          </Editable>
          <Editable as="p" id="order-detail-date" label="Order Date Text" className="text-sm text-gray-500">
            Placed on {new Date(order.placedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </Editable>
          {!isCancelled && (
            <p className={`text-sm font-medium mt-1 ${order.status === 'Delivered' ? 'text-green-600' : 'text-amber-600'}`}>
              {order.status === "Delivered" ? "Delivered on " : "Expected by "} {getDeliveryDate(order.placedAt)}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {canCancel && (
            <Editable as="button" kind="button" id="order-cancel-btn" label="Cancel Order Button" onClick={() => setShowCancelDialog(true)} className="text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-sm font-medium flex items-center gap-1.5 transition-colors">
              <XCircle size={15} /> Cancel Order
            </Editable>
          )}
          {order.status === "Delivered" && (
            <Editable as="button" kind="button" id="order-return-btn" label="Return Button" onClick={openReturnDialog} disabled={Boolean(pendingReturn)} className="text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-1.5 rounded-sm font-medium flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60">
              <Undo2 size={15} /> {pendingReturn ? RETURN_BUTTON_LABELS[pendingReturn.status] || "Return Requested" : "Return Item"}
            </Editable>
          )}
          {canDownloadInvoice && (
            <Editable as="button" kind="button" id="order-invoice-btn" label="Download Invoice Button" onClick={handleInvoiceDownload} disabled={isDownloadingInvoice} className="text-sm text-brand border border-brand/30 bg-brand/5 hover:bg-brand/10 px-4 py-1.5 rounded-sm font-medium flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              <Download size={15} /> {isDownloadingInvoice ? "Downloading..." : "Invoice"}
            </Editable>
          )}
        </div>
      </div>

      {latestActiveReturn && latestActiveReturn.status !== "pending" && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <p className="font-semibold">{RETURN_STATUS_NOTICES[latestActiveReturn.status]?.title || "Return status updated"}</p>
          <p className="mt-1">
            {RETURN_STATUS_NOTICES[latestActiveReturn.status]?.message(getReturnProductName(latestActiveReturn)) ||
              `Your return request for ${getReturnProductName(latestActiveReturn)} has been updated.`}
          </p>
        </div>
      )}

      {rejectedReturn && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Return request rejected</p>
          <p className="mt-1">
            Your return request for {getReturnProductName(rejectedReturn)} was rejected.
            {rejectedReturn.adminNote ? ` Reason: ${rejectedReturn.adminNote}` : ""}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline & Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <Editable as="div" kind="button" id="order-timeline-card" label="Order Timeline Card Background" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Order Status</h2>
            {isCancelled ? (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-md">
                <XCircle size={24} />
                <div>
                  <p className="font-semibold">Order Cancelled</p>
                  <p className="text-sm text-red-500 mt-1">This order was cancelled and has been fully refunded (if prepaid).</p>
                </div>
              </div>
            ) : (
              <div className="relative pl-4">
                <div className="absolute left-[1.35rem] top-4 bottom-4 w-0.5 bg-gray-100" />
                <div className="flex flex-col gap-6 relative">
                  {STEPS.map((step, i) => {
                    const done = i <= activeIdx;
                    const isCurrent = i === activeIdx;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className={`flex gap-4 ${!done && "opacity-40"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 bg-white relative z-10 transition-colors ${done ? "border-brand text-brand" : "border-gray-300 text-gray-400"} ${isCurrent && "bg-brand/10"}`}>
                          <Icon size={14} />
                        </div>
                        <div className="pt-1.5">
                          <h3 className={`font-semibold text-sm ${done ? "text-gray-900" : "text-gray-500"}`}>{step.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                          {isCurrent && step.key === "Shipped" && (
                            <p className="text-xs text-brand font-medium mt-2 bg-brand/5 px-2 py-1 rounded inline-block">Tracking ID: 1Z9999999999999999</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Editable>

          <Editable as="div" kind="button" id="order-items-card" label="Order Items Card Background" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Items in this Order ({order.items.length})</h2>
            <div className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <img loading="lazy" src={item.image} alt={item.name} className="w-20 h-20 rounded object-cover border border-gray-100" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80?text=?"; }} />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                    {item.selectedVariants && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.selectedVariants).map(([k,v]) => `${k}: ${v}`).join(" • ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.qty} × ₹{item.price.toLocaleString("en-IN")}</p>
                    <p className="font-semibold text-gray-900 text-sm mt-2">₹{(item.qty * item.price).toLocaleString("en-IN")}</p>
                    {!isCancelled && (
                      <Link to={`/product/${item.id}`} className="inline-block text-xs font-semibold text-brand hover:underline mt-2">
                        Review product
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Editable>
        </div>

        {/* Right Column: Summary & Address */}
        <div className="flex flex-col gap-6">
          <Editable as="div" kind="button" id="order-summary-card" label="Order Summary Card Background" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="flex flex-col gap-2 text-sm text-gray-600 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{order.total.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">Free</span></div>
              {order.coupon && <div className="flex justify-between"><span>Coupon ({order.coupon})</span><span className="text-green-600">Applied</span></div>}
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span><span>₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </Editable>

          <Editable as="div" kind="button" id="order-address-card" label="Order Address Card Background" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Delivery Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.address.name}</p>
              <p>{order.address.line}</p>
              <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
              <p className="pt-2"><strong>Phone:</strong> {order.address.phone}</p>
            </div>
          </Editable>

          <Editable as="div" kind="button" id="order-payment-card" label="Order Payment Card Background" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Payment Information</h2>
            <p className="text-sm text-gray-600">
              <strong>Method:</strong> {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}
            </p>
          </Editable>
        </div>
      </div>

      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-dialog-title"
        >
          <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <XCircle size={24} />
            </div>
            <h2 id="cancel-order-dialog-title" className="text-lg font-semibold text-gray-900">
              Cancel order?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure to cancel? This will cancel the complete order.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
                className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-order-dialog-title"
        >
          <form onSubmit={handleReturnSubmit} className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Undo2 size={24} />
            </div>
            <h2 id="return-order-dialog-title" className="text-lg font-semibold text-gray-900">
              Request return
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Submit this request to the admin team for review and refund processing.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Item
                <select
                  value={returnForm.productId}
                  onChange={(event) => {
                    const nextItem = order.items.find((item) => item.id === event.target.value);
                    setReturnForm((current) => ({
                      ...current,
                      productId: event.target.value,
                      quantity: Math.min(current.quantity, nextItem?.qty || 1),
                    }));
                  }}
                  className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                >
                  {order.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Quantity
                <input
                  type="number"
                  min="1"
                  max={selectedReturnItem?.qty || 1}
                  value={returnForm.quantity}
                  onChange={(event) =>
                    setReturnForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Reason
                <select
                  value={returnForm.reason}
                  onChange={(event) =>
                    setReturnForm((current) => ({ ...current, reason: event.target.value }))
                  }
                  className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                >
                  <option>Product no longer required</option>
                  <option>Wrong item received</option>
                  <option>Damaged or defective product</option>
                  <option>Quality issue</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Details
                <textarea
                  value={returnForm.details}
                  onChange={(event) =>
                    setReturnForm((current) => ({ ...current, details: event.target.value }))
                  }
                  rows={3}
                  placeholder="Add any extra details for admin..."
                  className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReturnDialog(false)}
                disabled={isSubmittingReturn}
                className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReturn}
                className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingReturn ? "Submitting..." : "Submit Return"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
