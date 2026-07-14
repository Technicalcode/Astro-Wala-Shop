import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById, selectAllOrders, selectOrdersError, selectOrdersLoading } from "../store/ordersSlice";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const orders = useSelector(selectAllOrders);
  const loading = useSelector(selectOrdersLoading);
  const error = useSelector(selectOrdersError);
  const dispatch = useDispatch();
  const order = orders.find((o) => o.id === orderId);

  useEffect(() => {
    if (orderId && !order) dispatch(fetchOrderById(orderId));
  }, [dispatch, order, orderId]);

  if (loading && !order) {
    return <div className="py-14 text-center text-gray-500">Loading order confirmation...</div>;
  }

  if (error && !order) {
    return <div className="py-14 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white rounded-md shadow-card py-14 px-6 flex flex-col items-center text-center max-w-lg mx-auto">
      <CheckCircle2 size={56} className="text-green-600 mb-4" />
      <h1 className="text-xl font-display font-semibold text-gray-900">Order Placed Successfully!</h1>
      <p className="text-sm text-gray-500 mt-2">
        Your order <span className="font-semibold text-gray-700">#{orderId}</span> has been confirmed.
      </p>

      {order && (
        <div className="w-full bg-canvas rounded-md p-4 mt-6 text-left">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
            <Package size={15} className="text-brand" />
            {order.items.length} {order.items.length === 1 ? "item" : "items"} • ₹
            {order.total.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-gray-500">
            Delivering to {order.address.name}, {order.address.city}, {order.address.state} -{" "}
            {order.address.pincode}
          </p>
          <p className="text-sm font-medium text-green-700 mt-3 border-t border-gray-200 pt-3">
            Estimated Delivery: {new Date(new Date(order.placedAt).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Payment: {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-7">
        <Link to="/account/orders" className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm">
          View Orders
        </Link>
        <Link to="/" className="border border-gray-300 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
