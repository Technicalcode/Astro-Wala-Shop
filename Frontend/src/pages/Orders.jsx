import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Package, CheckCircle2, Truck, PackageCheck, XCircle, ChevronRight, Filter } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders, selectOrdersForUser, selectOrdersLoading } from "../store/ordersSlice";
import { selectUser } from "../store/authSlice";
import Editable from "../components/editable/Editable";
import Pagination from "../components/Pagination";
import PageLoadingState from "../components/PageLoadingState";

const STEPS = [
  { key: "Confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "Shipped",   label: "Shipped",   icon: Truck },
  { key: "Delivered", label: "Delivered", icon: PackageCheck },
];

const statusColor = {
  Confirmed: "bg-blue-100 text-blue-700",
  Shipped:   "bg-amber-100 text-amber-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const FILTERS = ["All", "Confirmed", "Shipped", "Delivered", "Cancelled"];

const getDeliveryDate = (placedAt) => {
  return new Date(new Date(placedAt).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function OrderTimeline({ status }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-2 text-red-500 text-xs mt-3">
        <XCircle size={15} /> Order Cancelled
      </div>
    );
  }
  const activeIdx = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((step, i) => {
        const done = i <= activeIdx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-brand border-brand text-white" : "bg-white border-gray-200 text-gray-300"
              }`}>
                <Icon size={14} />
              </div>
              <span className={`text-[10px] mt-1 font-medium hidden sm:block ${done ? "text-brand" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 sm:w-16 h-0.5 mb-0 sm:mb-4 mx-1 ${
                i < activeIdx ? "bg-brand" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const allOrders = useSelector(user ? selectOrdersForUser(user.email) : () => []);
  const ordersLoading = useSelector(selectOrdersLoading);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user) dispatch(fetchMyOrders());
  }, [dispatch, user]);

  const filteredOrders = useMemo(() => {
    if (filter === "All") return allOrders;
    return allOrders.filter(o => o.status === filter);
  }, [allOrders, filter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!user) {
    return (
      <Editable as="div" kind="button" id="orders-login-card" label="Orders Login Card"
        className="bg-white rounded-md shadow-card py-16 text-center">
        <Editable as="p" id="orders-login-text" label="Orders Login Text"
          className="text-gray-600 mb-4">Log in to see your orders.</Editable>
        <Editable as={Link} to="/login" kind="button" id="orders-login-btn" label="Orders Login Button"
          className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm">Login</Editable>
      </Editable>
    );
  }

  if (ordersLoading && allOrders.length === 0) {
    return <PageLoadingState label="Loading your orders..." />;
  }

  if (allOrders.length === 0) {
    return (
      <Editable as="div" kind="button" id="orders-empty-card" label="Orders Empty Card"
        className="bg-white rounded-md shadow-card py-16 flex flex-col items-center gap-3">
        <Package size={44} className="text-gray-300" />
        <Editable as="p" id="orders-empty-text" label="Orders Empty Text"
          className="text-gray-600">You haven't placed any orders yet.</Editable>
        <Editable as={Link} to="/" kind="button" id="orders-shop-btn" label="Start Shopping Button"
          className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm">Start Shopping</Editable>
      </Editable>
    );
  }

  return (
    <Editable as="div" kind="button" id="orders-main-card" label="Orders Main Card Background"
      className="bg-white rounded-md shadow-card p-4 sm:p-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Editable as="h1" id="orders-heading" label="Orders Page Heading"
          className="font-display font-semibold text-xl text-gray-900">My Orders</Editable>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Filter size={16} className="text-gray-400 shrink-0" />
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 transition-colors ${
                filter === f ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No orders found for the "{filter}" status.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {currentOrders.map((o) => (
            <Editable key={o.id} as="div" kind="button" group="order-card" label="Order Card Background"
              className="border border-gray-200 rounded-md p-4 hover:border-brand/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                
                {/* Images */}
                <div className="flex gap-2 shrink-0">
                  {o.items.slice(0, 2).map((i) => (
                    <img loading="lazy" key={i.id} src={i.image} alt=""
                      className="w-16 h-16 rounded object-cover border border-gray-100"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/64?text=?"; }} />
                  ))}
                  {o.items.length > 2 && (
                    <div className="w-16 h-16 rounded bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-500 border border-gray-100">
                      +{o.items.length - 2}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Editable as="p" group="order-id-text" label="Order ID Text"
                        className="text-sm font-semibold text-gray-900">
                        Order #{o.id}
                      </Editable>
                      <Editable as="p" group="order-date-text" label="Order Date Text"
                        className="text-xs text-gray-500 mt-0.5">
                        Placed on {new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Editable>
                      {o.status !== "Cancelled" && (
                        <p className={`text-sm font-medium mt-1 ${o.status === 'Delivered' ? 'text-green-600' : 'text-amber-600'}`}>
                          {o.status === "Delivered" ? "Delivered on " : "Arriving by "} {getDeliveryDate(o.placedAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Editable as="p" group="order-total-text" label="Order Total"
                        className="font-semibold text-gray-900 text-sm">
                        ₹{o.total.toLocaleString("en-IN")}
                      </Editable>
                      <Editable as="span" group="order-status-badge" kind="button" label="Order Status Badge"
                        className={`mt-1 inline-block text-[11px] font-medium px-2 py-0.5 rounded-sm ${statusColor[o.status] || "bg-gray-100 text-gray-600"}`}>
                        {o.status}
                      </Editable>
                    </div>
                  </div>
                  
                  {/* Timeline & Actions */}
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                    <OrderTimeline status={o.status} />
                    <Link to={`/account/orders/${o.id}`} className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
                      View Details <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>

              </div>
            </Editable>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </Editable>
  );
}
