import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAllProducts, updateProduct } from "../../store/productsSlice";
import { selectCategories } from "../../store/categoriesSlice";
import { Search, AlertCircle, TrendingDown, Save, Download } from "lucide-react";
import Editable from "../../components/editable/Editable";
import { exportRowsToExcel } from "../../utils/excelExport";
import { getCategoryDisplayName } from "../../utils/categoryDisplay";

const LOW_STOCK_LIMIT = 5;
const PAGE_SIZE = 10;

const getDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getCreatedTime = (item) => {
  const date = new Date(item.createdAt || item.updatedAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const formatCreatedDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStockStatus = (product) => {
  const stock = Number(product.stock) || 0;
  if (stock === 0) return "out";
  if (stock > 0 && stock < LOW_STOCK_LIMIT) return "low";
  return "in";
};

export default function AdminInventory() {
  const dispatch = useDispatch();
  const allProducts = useSelector(selectAllProducts);
  const categories = useSelector(selectCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortFilter, setSortFilter] = useState("placeholder");
  const [stockFilter, setStockFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [savingAll, setSavingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(sessionStorage.getItem('adminInventoryPage')) || 1;
  });

  useEffect(() => {
    sessionStorage.setItem('adminInventoryPage', currentPage);
  }, [currentPage]);
  const isFirstRenderForPage = useRef(true);
  const [exporting, setExporting] = useState(false);
  
  // Local state to handle temporary stock edits before saving
  const [edits, setEdits] = useState({});
  const pendingChangesCount = Object.keys(edits).length;

  const getCategoryName = (product) => getCategoryDisplayName(product, categories);

  const handleStockChange = (id, newStock, currentStock) => {
    const normalizedStock = Math.max(0, Number(newStock) || 0);

    setEdits(prev => {
      const next = { ...prev };
      if (normalizedStock === currentStock) {
        delete next[id];
      } else {
        next[id] = normalizedStock;
      }
      return next;
    });
  };

  const saveAllStockChanges = async () => {
    const pendingEntries = Object.entries(edits);
    if (pendingEntries.length === 0) return;

    setSavingAll(true);
    const remainingEdits = { ...edits };
    const failures = [];

    for (const [id, stock] of pendingEntries) {
      const result = await dispatch(updateProduct({ id, patch: { stock } }));
      if (result.type?.endsWith("/rejected")) {
        failures.push(result.payload || `Failed to update ${id}`);
      } else {
        delete remainingEdits[id];
      }
    }

    setEdits(remainingEdits);
    setSavingAll(false);

    if (failures.length > 0) {
      alert(`Some stock changes could not be saved:\n${failures.join("\n")}`);
    }
  };

  const filteredProducts = allProducts
    .filter(p => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(query) ||
        getCategoryName(p).toLowerCase().includes(query);
      const matchesStock = stockFilter === "all" || getStockStatus(p) === stockFilter;
      const matchesDate = !dateFilter || getDateKey(p.createdAt || p.updatedAt) === dateFilter;

      return matchesSearch && matchesStock && matchesDate;
    })
    .sort((a, b) => {
      if (sortFilter === "newest") return getCreatedTime(b) - getCreatedTime(a);
      if (sortFilter === "oldest") return getCreatedTime(a) - getCreatedTime(b);
      if (sortFilter === "stock-low") return (Number(a.stock) || 0) - (Number(b.stock) || 0);
      if (sortFilter === "stock-high") return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      return 0;
    });
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE);
  const showingStart = filteredProducts.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filteredProducts.length);

  useEffect(() => {
    if (isFirstRenderForPage.current) {
      isFirstRenderForPage.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, sortFilter, stockFilter, dateFilter, allProducts.length]);

  const downloadInventoryExcel = async () => {
    setExporting(true);
    const exportRows = filteredProducts.map((product) => ({
      ...product,
      exportStock: edits[product.id] !== undefined ? edits[product.id] : product.stock,
    }));

    await exportRowsToExcel({
      fileName: "inventory",
      sheetName: "Inventory",
      rows: exportRows,
      columns: [
        { header: "S.No.", width: 9, value: (_, index) => index + 1 },
        { header: "Product ID", width: 26, value: (product) => product.id },
        { header: "Product Name", width: 32, value: (product) => product.name },
        { header: "Category", width: 22, value: getCategoryName },
        { header: "Available Stock", width: 17, value: (product) => Number(product.exportStock) || 0 },
        {
          header: "Status",
          width: 16,
          value: (product) => {
            const status = getStockStatus({ ...product, stock: product.exportStock });
            return { out: "Out of Stock", low: "Low Stock", in: "In Stock" }[status];
          },
        },
        {
          header: "Save Status",
          width: 15,
          value: (product) => (edits[product.id] !== undefined ? "Pending" : "Saved"),
        },
        { header: "Created Date", width: 17, value: (product) => formatCreatedDate(product.createdAt) },
      ],
    });
    setExporting(false);
  };

  const outOfStockCount = allProducts.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <Editable as="h1" id="admin-inv-heading" kind="button" label="Inventory Heading" className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
                Inventory Management
              </Editable>
              {outOfStockCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-500/20 text-red-100 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/30 shadow-inner">
                  <AlertCircle size={14} className="animate-pulse" /> {outOfStockCount} out of stock
                </div>
              )}
            </div>
            <Editable as="p" id="admin-inv-sub" kind="button" label="Inventory Subtext" className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
              Track and adjust your stock levels seamlessly.
            </Editable>
          </div>
          <div className="shrink-0 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadInventoryExcel}
              disabled={exporting || filteredProducts.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-white hover:bg-emerald-500 hover:text-white hover:border-emerald-500 border border-white/20 transition-all shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download size={18} /> {exporting ? "Exporting..." : "Export Excel"}
            </button>
            <button
              type="button"
              onClick={() => setEdits({})}
              disabled={pendingChangesCount === 0 || savingAll}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={saveAllStockChanges}
              disabled={pendingChangesCount === 0 || savingAll}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
                pendingChangesCount > 0 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow" 
                  : "bg-white/10 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              <Save size={18} />
              {savingAll ? "Saving..." : `Save Changes${pendingChangesCount ? ` (${pendingChangesCount})` : ""}`}
            </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {/* Toolbar & Table Area */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-white/50 flex flex-col xl:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative group flex-1 sm:min-w-[250px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors group-focus-within:text-brand">
                <Search size={18} className="text-gray-400 group-focus-within:text-brand transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full pl-10 p-2.5 transition-all outline-none shadow-sm hover:border-gray-300"
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block p-2.5 transition-all outline-none shadow-sm hover:border-gray-300 flex-1 sm:w-32 cursor-pointer appearance-none"
              >
                <option value="placeholder" disabled hidden>Sort by</option>
                <option value="default">Default Sort</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="stock-low">Stock: Low to High</option>
                <option value="stock-high">Stock: High to Low</option>
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block p-2.5 transition-all outline-none shadow-sm hover:border-gray-300 flex-1 sm:w-36 cursor-pointer appearance-none"
              >
                <option value="all">All stock</option>
                <option value="out">Out of stock</option>
                <option value="low">Low stock (1-{LOW_STOCK_LIMIT - 1})</option>
                <option value="in">In stock</option>
              </select>
            </div>
            <div className="relative group flex-1 sm:w-40">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full p-2.5 transition-all outline-none shadow-sm hover:border-gray-300"
                aria-label="Filter inventory by created date"
              />
            </div>
          </div>
        </div>

      <Editable as="div" kind="button" id="admin-inv-table-card" label="Inventory Table Card Background" className="overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[850px]">
          <thead>
            <tr className="text-left bg-gray-50/50">
              <Editable as="th" group="admin-inv-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs w-16">#</Editable>
              <Editable as="th" group="admin-inv-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Product Details</Editable>
              <Editable as="th" group="admin-inv-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Category</Editable>
              <Editable as="th" group="admin-inv-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Status</Editable>
              <Editable as="th" group="admin-inv-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Available Stock</Editable>
              <Editable as="th" group="admin-inv-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Created Date</Editable>
              <Editable as="th" group="admin-inv-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Change</Editable>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedProducts.map((p, index) => {
              const currentStock = p.stock !== undefined ? p.stock : 0;
              const isEdited = edits[p.id] !== undefined && edits[p.id] !== currentStock;
              const displayStock = edits[p.id] !== undefined ? edits[p.id] : currentStock;
              const isOutOfStock = currentStock === 0;
              const isLowStock = currentStock > 0 && currentStock < LOW_STOCK_LIMIT;
              
              return (
                <tr key={p.id} className={`group transition-all duration-200 ${isOutOfStock ? 'bg-red-50/40 hover:bg-red-50/80' : isLowStock ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-indigo-50/40'}`}>
                  <td className="py-4 px-6 font-bold text-gray-400">{pageStart + index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                        <img loading="lazy" src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 border border-black/5 rounded-xl"></div>
                      </div>
                      <div className="flex flex-col">
                        <Editable as="span" group="admin-inv-name" kind="button" label="Product Name" className="text-gray-900 font-bold text-base group-hover:text-brand transition-colors line-clamp-1 max-w-[250px]">{p.name}</Editable>
                      </div>
                    </div>
                  </td>
                  <Editable as="td" group="admin-inv-category" kind="button" label="Product Category" className="py-4 px-6">
                    <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold capitalize border border-gray-200">
                      {getCategoryName(p)}
                    </span>
                  </Editable>
                  
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> In Stock
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <input 
                      type="number" 
                      min="0"
                      value={displayStock}
                      onChange={(e) => handleStockChange(p.id, e.target.value, currentStock)}
                      className={`w-24 border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 transition-all ${isEdited ? 'border-brand bg-brand/5 focus:ring-brand/20 text-brand' : 'border-gray-200 focus:ring-gray-200 focus:border-gray-400 text-gray-700 shadow-sm'}`}
                    />
                  </td>
                  <Editable as="td" group="admin-inv-created" kind="button" label="Inventory Created Date" className="py-4 px-6 text-gray-500 text-sm font-medium whitespace-nowrap">
                    {formatCreatedDate(p.createdAt)}
                  </Editable>
                  
                  <td className="py-4 px-6 text-right">
                    {isEdited ? (
                      <span className="inline-flex items-center rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand">
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-gray-100 border border-gray-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Saved
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="py-20 text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                     <Search size={28} />
                   </div>
                   <p className="text-gray-500 text-base font-medium">No products found matching "{searchTerm}"</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{showingStart}</span> to <span className="font-bold text-gray-900">{showingEnd}</span> of <span className="font-bold text-gray-900">{filteredProducts.length}</span> items
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
      </div>
    </div>
  );
}
