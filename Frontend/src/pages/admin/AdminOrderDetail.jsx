import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllOrders, selectAllOrders, updateOrderStatus } from "../../store/ordersSlice";
import { ChevronLeft, Package, Truck, User, CreditCard, Save } from "lucide-react";
import Editable from "../../components/editable/Editable";

const STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const order = useSelector(selectAllOrders).find(o => o.id === orderId);
  const [adminNotes, setAdminNotes] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order?.id]);

  if (!order) {
    return <div className="text-gray-500">Order not found.</div>;
  }

  const displayStatus = selectedStatus || order.status;
  const hasPendingStatus = displayStatus !== order.status;

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const saveStatusChange = async () => {
    if (!hasPendingStatus) return;

    setSavingStatus(true);
    const result = await dispatch(updateOrderStatus({ id: order.id, status: displayStatus }));
    setSavingStatus(false);

    if (result.type?.endsWith("/rejected")) {
      alert("Error updating order: " + (result.payload || "Unknown error"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/orders" className="text-sm font-medium text-gray-500 hover:text-brand flex items-center gap-1 w-fit">
        <ChevronLeft size={16} /> Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Editable as="h1" id="admin-od-heading" kind="button" label="Order Detail Heading" className="text-xl font-semibold text-gray-900">
            Order #{order.id}
          </Editable>
          <p className="text-sm text-gray-500 mt-1">Placed on: {new Date(order.placedAt).toLocaleString("en-IN")}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select 
            value={displayStatus}
            onChange={handleStatusChange}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-brand bg-white font-medium"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasPendingStatus && (
            <span className="rounded bg-brand/10 px-2 py-1 text-xs font-semibold uppercase text-brand">
              Pending
            </span>
          )}
          <button
            type="button"
            onClick={() => setSelectedStatus(order.status)}
            disabled={!hasPendingStatus || savingStatus}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={saveStatusChange}
            disabled={!hasPendingStatus || savingStatus}
            className="bg-brand text-white rounded px-3 py-1.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingStatus ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Items & Payment */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Editable as="div" kind="button" id="admin-od-items-card" label="Order Items Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-brand" /> Items ({order.items.length})
            </h2>
            <div className="flex flex-col gap-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <img loading="lazy" src={item.image} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                  <div className="flex-1">
                    <Editable as="h3" group="admin-od-item-name" kind="button" label="Item Name" className="font-medium text-gray-900 text-sm">{item.name}</Editable>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.qty} • ₹{item.price.toLocaleString("en-IN")}/each</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <div className="w-64">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Subtotal</span>
                  <span>₹{(Number(order.subtotal) || Number(order.total)).toLocaleString("en-IN")}</span>
                </div>
                {(Number(order.couponDiscount) > 0 || (Number(order.discount) > 0 && !order.couponDiscount && !order.walletDiscount)) && (
                  <div className="flex justify-between text-sm text-green-600 mb-2">
                    <span>Coupon Discount {order.coupon ? `(${order.coupon})` : ""}</span>
                    <span>-₹{(Number(order.couponDiscount) || Number(order.discount)).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {Number(order.walletDiscount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-2">
                    <span>Wallet Discount</span>
                    <span>-₹{Number(order.walletDiscount).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </Editable>

          <Editable as="div" kind="button" id="admin-od-payment-card" label="Payment Details Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-brand" /> Payment Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Method</p>
                <p className="font-medium text-gray-900 uppercase">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Payment Status</p>
                <p className={`font-medium ${order.paymentMethod === 'cod' && displayStatus !== 'Delivered' ? 'text-amber-600' : 'text-green-600'}`}>
                  {order.paymentMethod === 'cod' && displayStatus !== 'Delivered' ? 'Pending (COD)' : 'Paid'}
                </p>
              </div>
            </div>
          </Editable>
        </div>

        {/* Right Column: Customer & Shipping */}
        <div className="flex flex-col gap-6">
          <Editable as="div" kind="button" id="admin-od-customer-card" label="Customer Info Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-brand" /> Customer Info
            </h2>
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">{order.address?.name || "Guest User"}</p>
              <p>{order.address?.phone || "+91 XXXXXXXXXX"}</p>
              <p className="mt-3 text-gray-500">Shipping Address:</p>
              <p className="mt-1 leading-relaxed">
                {order.address?.line}<br/>
                {order.address?.city}, {order.address?.state} - {order.address?.pincode}
              </p>
            </div>
          </Editable>

          <Editable as="div" kind="button" id="admin-od-shipping-card" label="Shipping Tracking Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck size={18} className="text-brand" /> Shipment Tracking
            </h2>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Tracking URL / AWB" 
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
              />
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2">
                <Save size={15} /> Save Tracking Info
              </button>
            </div>
          </Editable>
          
          <Editable as="div" kind="button" id="admin-od-notes-card" label="Admin Notes Card" className="bg-yellow-50 border border-yellow-200 rounded-md shadow-card p-6">
            <h2 className="font-semibold text-yellow-800 mb-3 text-sm">Internal Notes</h2>
            <textarea 
              rows={3}
              placeholder="Private notes (customer won't see this)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full border border-yellow-300 bg-white rounded px-3 py-2 text-sm focus:outline-yellow-500 resize-none mb-3"
            />
            <button className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 text-xs font-semibold py-1.5 px-4 rounded transition-colors">
              Save Note
            </button>
          </Editable>
        </div>

      </div>
    </div>
  );
}
