import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAllOrders, selectAllOrders, updateOrderStatus } from "../../store/ordersSlice";
import Editable from "../../components/editable/Editable";
import { Download, Search } from "lucide-react";

const STATUSES = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];

const statusColor = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Packed: "bg-purple-100 text-purple-700",
  Shipped: "bg-amber-100 text-amber-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

export default function AdminOrders() {
  const dispatch = useDispatch();
  const orders = useSelector(selectAllOrders);
  const [statusEdits, setStatusEdits] = useState({});
  const [savingChanges, setSavingChanges] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(sessionStorage.getItem('adminOrdersPage')) || 1;
  });

  useEffect(() => {
    sessionStorage.setItem('adminOrdersPage', currentPage);
  }, [currentPage]);
  
  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    const idMatches = String(o.id).toLowerCase().includes(query);
    const nameMatches = (o.address?.name || "Guest").toLowerCase().includes(query);
    const emailMatches = (o.userEmail || "").toLowerCase().includes(query);
    return idMatches || nameMatches || emailMatches;
  });
  
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedOrders = filteredOrders.slice(pageStart, pageStart + PAGE_SIZE);
  const showingStart = filteredOrders.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filteredOrders.length);

  const pendingChangesCount = Object.keys(statusEdits).length;

  const handleStatusUpdate = (id, status, currentStatus) => {
    setStatusEdits((current) => {
      const next = { ...current };
      if (status === currentStatus) {
        delete next[id];
      } else {
        next[id] = status;
      }
      return next;
    });
  };

  const discardChanges = () => {
    setStatusEdits({});
  };

  const saveAllOrderChanges = async () => {
    const entries = Object.entries(statusEdits);
    if (entries.length === 0) return;

    setSavingChanges(true);
    const remainingEdits = { ...statusEdits };
    const failures = [];

    for (const [id, status] of entries) {
      const result = await dispatch(updateOrderStatus({ id, status }));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Order ${id}: ${result.payload || "Unknown error"}`);
      } else {
        delete remainingEdits[id];
      }
    }

    setStatusEdits(remainingEdits);
    setSavingChanges(false);

    if (failures.length > 0) {
      alert(`Some order changes could not be saved:\n${failures.join("\n")}`);
    }
  };

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const downloadOrdersExcel = async () => {
    setExporting(true);
    const { exportRowsToExcel } = await import("../../utils/excelExport");
    await exportRowsToExcel({
      fileName: "orders",
      sheetName: "Orders",
      rows: orders,
      columns: [
        { header: "S.No.", width: 9, value: (_, index) => index + 1 },
        { header: "Order ID", width: 27, value: (order) => order.id },
        { header: "Customer", width: 24, value: (order) => order.address?.name || "Guest" },
        { header: "Email", width: 30, value: (order) => order.userEmail || "" },
        { header: "Phone", width: 17, value: (order) => order.address?.phone || "" },
        {
          header: "Products",
          width: 42,
          value: (order) =>
            order.items.map((item) => `${item.name || "Product"} x ${item.qty}`).join(", "),
        },
        { header: "Items", width: 10, value: (order) => order.items.length },
        { header: "Subtotal", width: 14, value: (order) => Number(order.subtotal) || 0 },
        { header: "Discount", width: 14, value: (order) => Number(order.discount) || 0 },
        { header: "Total", width: 14, value: (order) => Number(order.total) || 0 },
        { header: "Payment Method", width: 18, value: (order) => order.paymentMethod?.toUpperCase() || "" },
        { header: "Payment Status", width: 18, value: (order) => order.paymentStatus || "" },
        {
          header: "Order Status",
          width: 17,
          value: (order) => statusEdits[order.id] || order.status,
        },
        {
          header: "Delivery Address",
          width: 42,
          value: (order) =>
            [
              order.address?.line,
              order.address?.city,
              order.address?.state,
              order.address?.pincode,
            ]
              .filter(Boolean)
              .join(", "),
        },
        {
          header: "Placed At",
          width: 21,
          value: (order) => new Date(order.placedAt).toLocaleString("en-IN"),
        },
      ],
    });
    setExporting(false);
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
              id="admin-orders-heading"
              kind="button"
              label="Orders Page Heading"
              className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3"
            >
              Orders Management
            </Editable>
            <Editable
              as="p"
              id="admin-orders-subtext"
              kind="button"
              label="Orders Page Subtext"
              className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed"
            >
              {orders.length} orders placed. Track, manage, and process customer purchases.
            </Editable>
          </div>
          <div className="shrink-0 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadOrdersExcel}
              disabled={exporting || orders.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-white hover:bg-emerald-500 hover:text-white hover:border-emerald-500 border border-white/20 transition-all shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download size={18} /> {exporting ? "Exporting..." : "Export Excel"}
            </button>
            <button
              type="button"
              onClick={discardChanges}
              disabled={pendingChangesCount === 0 || savingChanges}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={saveAllOrderChanges}
              disabled={pendingChangesCount === 0 || savingChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                pendingChangesCount > 0 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow" 
                  : "bg-white/10 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {savingChanges ? "Saving..." : `Save Changes${pendingChangesCount ? ` (${pendingChangesCount})` : ""}`}
            </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>
      
      {/* Table Area */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-0">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-white/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative group w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors group-focus-within:text-brand">
              <Search size={18} className="text-gray-400 group-focus-within:text-brand transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search by Order ID, Name or Email..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full pl-10 p-2.5 transition-all outline-none shadow-sm hover:border-gray-300"
            />
          </div>
        </div>

      {filteredOrders.length === 0 ? (
        <Editable
          as="div"
          kind="button"
          id="admin-orders-empty-card"
          label="No Orders Card Background"
          className="bg-white py-20 text-center text-gray-500"
        >
          <Editable
            as="span"
            id="admin-orders-empty-text"
            kind="button"
            label="No Orders Text"
            className="text-base font-medium"
          >
            No orders found matching "{searchTerm}".
          </Editable>
        </Editable>
      ) : (
        <Editable
          as="div"
          kind="button"
          id="admin-orders-table-card"
          label="Orders Table Card Background"
          className="overflow-x-auto p-0"
        >
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="text-left bg-gray-50/50">
                <Editable as="th" group="admin-orders-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs w-24">Order ID</Editable>
                <Editable as="th" group="admin-orders-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer</Editable>
                <Editable as="th" group="admin-orders-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Items</Editable>
                <Editable as="th" group="admin-orders-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Total</Editable>
                <Editable as="th" group="admin-orders-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Payment</Editable>
                <Editable as="th" group="admin-orders-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</Editable>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map((o) => {
                const displayStatus = statusEdits[o.id] || o.status;
                const isEdited = statusEdits[o.id] !== undefined;

                return (
                <tr key={o.id} className="group transition-all duration-200 hover:bg-indigo-50/40">
                  <td className="py-4 px-6 font-bold text-brand hover:underline">
                    <Link to={`/admin/orders/${o.id}`}>#{o.id}</Link>
                  </td>
                  <Editable as="td" group="admin-orders-cell" kind="button" label="Table Cell Text" className="py-4 px-6 text-gray-900 font-bold">{o.address?.name || "Guest"}</Editable>
                  <Editable as="td" group="admin-orders-cell" kind="button" label="Table Cell Text" className="py-4 px-6 text-gray-600 font-medium">{o.items.length}</Editable>
                  <td className="py-4 px-6">
                    <Editable as="span" group="admin-orders-cell" kind="button" label="Table Cell Text" className="text-gray-900 font-bold text-base">
                      ₹{o.total.toLocaleString("en-IN")}
                    </Editable>
                  </td>
                  <Editable as="td" group="admin-orders-cell" kind="button" label="Table Cell Text" className="py-4 px-6 text-gray-500 uppercase text-xs font-bold tracking-wider">{o.paymentMethod}</Editable>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <select
                        value={displayStatus}
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value, o.status)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border-0 shadow-sm cursor-pointer appearance-none transition-all outline-none focus:ring-2 focus:ring-brand/20 ${statusColor[displayStatus] || "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {isEdited && (
                        <span className="inline-flex items-center rounded-lg bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm">
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{showingStart}</span> to <span className="font-bold text-gray-900">{showingEnd}</span> of <span className="font-bold text-gray-900">{filteredOrders.length}</span> items
              </span>
              <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  Previous
                </button>
                <span className="font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm text-sm">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Editable>
      )}
      </div>
    </div>
  );
}
