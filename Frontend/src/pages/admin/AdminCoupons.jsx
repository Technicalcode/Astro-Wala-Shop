import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Tag, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, selectAllProducts } from "../../store/productsSlice";
import { fetchCategories, selectCategories } from "../../store/categoriesSlice";
import {
  backendUrl,
  fetchWithAuth,
  readApiResponse,
} from "../../config/api";
import Editable from "../../components/editable/Editable";

const emptyForm = {
  couponId: "",
  targetType: "all",
  category_id: "",
  product_id: "",
  customerEmail: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  expireDate: "",
  maxLimit: "1",
  minPurchaseAmount: "0",
  isActive: true,
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDiscount = (coupon) =>
  coupon.discountType === "percentage"
    ? `${coupon.discountValue}%`
    : `Rs ${Number(coupon.discountValue || 0).toLocaleString("en-IN")}`;

const formatTarget = (coupon) => {
  if (coupon.targetType === "category") return coupon.categoryName || "Category";
  if (coupon.targetType === "product") return coupon.productName || "Product";
  return "All Products";
};

const formatCustomer = (coupon) => coupon.customerEmail || "All customers";

const PAGE_SIZE = 10;

export default function AdminCoupons() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const categories = useSelector(selectCategories);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(sessionStorage.getItem('adminCouponsPage')) || 1;
  });

  const [pendingCreates, setPendingCreates] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [savingChanges, setSavingChanges] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('adminCouponsPage', currentPage);
  }, [currentPage]);

  const pendingDeleteIds = new Set(pendingDeletes);
  const pendingChangesCount = pendingCreates.length + Object.keys(pendingUpdates).length + pendingDeletes.length;

  const stagedCoupons = [
    ...pendingCreates.map((c) => ({
      ...c,
      _pendingAction: "create",
    })),
    ...coupons
      .filter((c) => !pendingDeleteIds.has(c.id))
      .map((c) => ({
        ...c,
        ...(pendingUpdates[c.id] || {}),
        _pendingAction: pendingUpdates[c.id] ? "update" : "",
      })),
  ];

  const filteredCoupons = stagedCoupons.filter((c) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    const idMatches = c.couponId?.toLowerCase().includes(query);
    const emailMatches = c.customerEmail?.toLowerCase().includes(query);
    return idMatches || emailMatches;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedCoupons = filteredCoupons.slice(pageStart, pageStart + PAGE_SIZE);
  const showingStart = filteredCoupons.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filteredCoupons.length);

  const loadCoupons = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/admin/coupons`);
      const data = await readApiResponse(res);

      if (!res.ok) throw new Error(data.message || "Failed to fetch coupons");
      setCoupons(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length === 0) dispatch(fetchProducts());
    if (categories.length === 0) dispatch(fetchCategories());
    loadCoupons();
  }, [dispatch]);

  const openAdd = () => {
    setForm({
      ...emptyForm,
    });
    setEditingId(null);
    setShowForm(true);
    setError("");
  };

  const openEdit = (coupon) => {
    setForm({
      couponId: coupon.couponId || "",
      targetType: coupon.targetType || (coupon.categoryId ? "category" : coupon.productId ? "product" : "all"),
      category_id: coupon.categoryId || coupon.category_id || "",
      product_id: coupon.productId || coupon.product_id || "",
      customerEmail: coupon.customerEmail || "",
      discountType: coupon.discountType || "percentage",
      discountValue: String(coupon.discountValue || ""),
      startDate: toDateInput(coupon.startDate),
      expireDate: toDateInput(coupon.expireDate),
      maxLimit: String(coupon.maxLimit || 1),
      minPurchaseAmount: String(coupon.minPurchaseAmount || 0),
      isActive: Boolean(coupon.isActive),
    });
    setEditingId(coupon.id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this coupon? It will be deleted from DB only after Save Changes.")) return;

    if (String(id).startsWith("temp-")) {
      setPendingCreates((current) => current.filter((c) => c.id !== id));
      return;
    }

    setPendingUpdates((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setPendingDeletes((current) => (current.includes(id) ? current : [...current, id]));
  };

  const toggleActive = async (coupon) => {
    const id = coupon.id;
    if (String(id).startsWith("temp-")) {
      setPendingCreates((current) => 
        current.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c)
      );
      return;
    }

    setPendingUpdates((current) => ({
      ...current,
      [id]: {
        ...(current[id] || coupon),
        isActive: !(current[id] ? current[id].isActive : coupon.isActive)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      targetType: form.targetType,
      category_id: form.targetType === "category" ? form.category_id : undefined,
      product_id: form.targetType === "product" ? form.product_id : undefined,
      customerEmail: form.customerEmail.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      startDate: form.startDate,
      expireDate: form.expireDate,
      maxLimit: Number(form.maxLimit),
      minPurchaseAmount: Number(form.minPurchaseAmount),
      isActive: form.isActive,
      couponId: form.couponId || (editingId ? undefined : `NEW-${Date.now().toString().slice(-4)}`),
    };

    if (editingId) {
      if (String(editingId).startsWith("temp-")) {
        setPendingCreates((current) =>
          current.map((c) => (c.id === editingId ? { ...c, ...payload } : c)),
        );
      } else {
        setPendingUpdates((current) => ({
          ...current,
          [editingId]: payload,
        }));
      }
    } else {
      setPendingCreates((current) => [
        {
          ...payload,
          id: `temp-coupon-${Date.now()}`,
          createdAt: new Date().toISOString()
        },
        ...current,
      ]);
    }

    setShowForm(false);
  };

  const discardChanges = () => {
    setPendingCreates([]);
    setPendingUpdates({});
    setPendingDeletes([]);
  };

  const saveAllCouponChanges = async () => {
    if (pendingChangesCount === 0) return;

    setSavingChanges(true);
    let nextCreates = [...pendingCreates];
    let nextUpdates = { ...pendingUpdates };
    let nextDeletes = [...pendingDeletes];
    const failures = [];

    for (const coupon of pendingCreates) {
      try {
        const payload = { ...coupon };
        delete payload.id;
        delete payload._pendingAction;
        delete payload.createdAt;
        if (payload.couponId && payload.couponId.startsWith("NEW-")) delete payload.couponId;
        
        const res = await fetchWithAuth(`${backendUrl}/api/v1/admin/coupons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await readApiResponse(res);
        if (!res.ok) throw new Error(data.message || "Failed to create");
        
        setCoupons(current => [data.data, ...current]);
        nextCreates = nextCreates.filter((c) => c.id !== coupon.id);
      } catch (err) {
        failures.push(`Create: ${err.message}`);
      }
    }

    for (const [id, patch] of Object.entries(pendingUpdates)) {
      try {
        const payload = { ...patch };
        delete payload.id;
        delete payload._pendingAction;
        delete payload.createdAt;
        
        const res = await fetchWithAuth(`${backendUrl}/api/v1/admin/coupons/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await readApiResponse(res);
        if (!res.ok) throw new Error(data.message || "Failed to update");

        setCoupons(current => current.map((c) => c.id === id ? data.data : c));
        delete nextUpdates[id];
      } catch (err) {
        failures.push(`Update: ${err.message}`);
      }
    }

    for (const id of pendingDeletes) {
      try {
        const res = await fetchWithAuth(`${backendUrl}/api/v1/admin/coupons/${id}`, {
          method: "DELETE",
        });
        const data = await readApiResponse(res);
        if (!res.ok) throw new Error(data.message || "Failed to delete");

        setCoupons(current => current.filter((c) => c.id !== id));
        nextDeletes = nextDeletes.filter((item) => item !== id);
      } catch (err) {
        failures.push(`Delete: ${err.message}`);
      }
    }

    setPendingCreates(nextCreates);
    setPendingUpdates(nextUpdates);
    setPendingDeletes(nextDeletes);
    setSavingChanges(false);

    if (failures.length > 0) {
      alert(`Some changes could not be saved:\n${failures.join("\n")}`);
    }
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
              id="admin-coupons-heading"
              kind="button"
              label="Coupons Page Heading"
              className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3"
            >
              Coupons & Discounts
            </Editable>
            <Editable
              as="p"
              id="admin-coupons-sub"
              kind="button"
              label="Coupons Page Subtext"
              className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed"
            >
              Create public or customer-specific coupons and track usage
            </Editable>
          </div>
          <div className="shrink-0 flex flex-wrap gap-3">
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
              onClick={saveAllCouponChanges}
              disabled={pendingChangesCount === 0 || savingChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                pendingChangesCount > 0 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow" 
                  : "bg-white/10 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {savingChanges ? "Saving..." : `Save Changes${pendingChangesCount > 0 ? ` (${pendingChangesCount})` : ""}`}
            </button>
            <Editable
              as="button"
              onClick={openAdd}
              id="admin-add-coupon-btn"
              kind="button"
              label="Create Coupon Button"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-brand hover:bg-gray-100 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus size={18} /> Create New Coupon
            </Editable>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {error && !showForm && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Editable as="div" kind="button" id="admin-coupons-table-card" label="Coupons Table Card Background" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-0">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-white/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative group w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors group-focus-within:text-brand">
              <Search size={18} className="text-gray-400 group-focus-within:text-brand transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search by Coupon ID or Email..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full pl-10 p-2.5 transition-all outline-none shadow-sm hover:border-gray-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1220px]">
          <thead>
            <tr className="text-left bg-gray-50/50">
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Coupon ID</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Product Category</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Customer</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Discount</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Start Date</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Expire Date</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Max/User</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Min Price</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Usage</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-gray-500 font-medium">Loading coupons...</td>
              </tr>
            ) : filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-20 text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                     <Tag size={28} />
                   </div>
                   <p className="text-gray-500 text-base font-medium">No coupons found matching "{searchTerm}".</p>
                </td>
              </tr>
            ) : (
              paginatedCoupons.map((coupon) => (
                <tr key={coupon.id} className="group transition-all duration-200 hover:bg-indigo-50/40">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-gray-400 group-hover:text-brand transition-colors" />
                      <span className="font-bold text-gray-900 tracking-wide uppercase group-hover:text-brand transition-colors">
                        {coupon.couponId}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-gray-800 text-base">{formatTarget(coupon)}</div>
                    <div className="text-xs text-gray-500 capitalize mt-0.5">
                      {coupon.targetType === "product" ? "Specific product" : coupon.targetType || "all"}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-gray-800 text-base">{formatCustomer(coupon)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {coupon.customerEmail ? "Specific user" : "Public coupon"}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-indigo-50 text-brand font-bold text-sm shadow-sm border border-indigo-100">
                      {formatDiscount(coupon)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-medium">{formatDate(coupon.startDate)}</td>
                  <td className="py-4 px-6 text-gray-600 font-medium">{formatDate(coupon.expireDate)}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-700 font-bold border border-gray-200 shadow-sm">
                      {coupon.maxLimit}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-700 font-medium">
                    Rs {Number(coupon.minPurchaseAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-700 font-bold border border-gray-200 shadow-sm">
                      {coupon.usage}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${coupon.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></div>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(coupon)} className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors" aria-label="Edit coupon">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete coupon">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
          {filteredCoupons.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{showingStart}</span> to <span className="font-bold text-gray-900">{showingEnd}</span> of <span className="font-bold text-gray-900">{filteredCoupons.length}</span> items
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
        </div>
      </Editable>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Editable as="div" kind="button" id="admin-coupon-modal-bg" label="Coupon Modal Background" className="bg-white rounded-md w-full max-w-2xl p-5 relative shadow-xl">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close coupon form">
              <X size={18} />
            </button>
            <h2 className="font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Coupon" : "Create Coupon"}
            </h2>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Coupon ID</label>
                <div className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-sm text-gray-500">
                  {editingId ? form.couponId : "Generated automatically after save"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Category</label>
                <select
                  required
                  value={form.targetType === "all" ? "all" : form.targetType === "category" ? form.category_id : "product"}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "all") {
                      setForm({ ...form, targetType: "all", category_id: "", product_id: "" });
                    } else {
                      setForm({ ...form, targetType: "category", category_id: value, product_id: "" });
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand bg-white"
                >
                  <option value="all">All Products</option>
                  {form.targetType === "product" && (
                    <option value="product">
                      Specific Product: {products.find((product) => product.id === form.product_id)?.name || "Product"}
                    </option>
                  )}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Customer Email (optional)
                </label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="Leave blank for all customers"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Fill this to make the coupon usable only by that registered user.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Value</label>
                <input
                  required
                  type="number"
                  min="1"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === "percentage" ? "20" : "500"}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expire Date</label>
                <input
                  required
                  type="date"
                  value={form.expireDate}
                  onChange={(e) => setForm({ ...form, expireDate: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Limit Per User</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.maxLimit}
                  onChange={(e) => setForm({ ...form, maxLimit: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum Price Required
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.minPurchaseAmount}
                  onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Coupon applies only when eligible cart value reaches this amount.
                </p>
              </div>

              <label className="flex items-center gap-2 mt-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded text-brand focus:ring-brand accent-brand"
                />
                <span className="text-sm text-gray-700">Coupon is active</span>
              </label>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-sm text-sm"
                >
                  Cancel
                </button>
                <Editable as="button" id="admin-coupon-save-btn" kind="button" label="Save Coupon Button" type="submit" disabled={saving} className="bg-brand text-white font-semibold px-5 py-2 rounded-sm text-sm disabled:opacity-60">
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Coupon"}
                </Editable>
              </div>
            </form>
          </Editable>
        </div>
      )}
    </div>
  );
}
