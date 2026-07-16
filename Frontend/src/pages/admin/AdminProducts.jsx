import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, X, Upload, ImageOff, Download, Search } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectAllProducts, createProduct, updateProduct, deleteProduct } from "../../store/productsSlice";
import { selectCategories } from "../../store/categoriesSlice";
import { fileToCompressedDataUrl } from "../../utils/imageUtils";
import ImageEditorModal from "../../components/ImageEditorModal";
import Editable from "../../components/editable/Editable";
import { exportRowsToExcel } from "../../utils/excelExport";
import { getCategoryDisplayName } from "../../utils/categoryDisplay";

const emptyForm = {
  name: "",
  category: "",
  brand: "",
  price: "",
  mrp: "",
  sizes: "",
  variantOptions: [],
  highlights: "",
  description: "",
  stock: "100",
  bestseller: false,
};

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
  if (!value) return "Pending";
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

const isTempId = (id) => String(id || "").startsWith("temp-");

export default function AdminProducts() {
  const dispatch = useDispatch();
  const allProducts = useSelector(selectAllProducts);
  const categories = useSelector(selectCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [editingImageSrc, setEditingImageSrc] = useState(null);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("placeholder");
  const [stockFilter, setStockFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [pendingCreates, setPendingCreates] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [savingChanges, setSavingChanges] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(sessionStorage.getItem('adminProductsPage')) || 1;
  });

  useEffect(() => {
    sessionStorage.setItem('adminProductsPage', currentPage);
  }, [currentPage]);
  const isFirstRenderForPage = useRef(true);
  const [exporting, setExporting] = useState(false);

  const pendingDeleteIds = new Set(pendingDeletes);
  const pendingChangesCount =
    pendingCreates.length + Object.keys(pendingUpdates).length + pendingDeletes.length;
  const stagedProducts = [
    ...allProducts
      .filter((product) => !pendingDeleteIds.has(product.id))
      .map((product) => ({
        ...product,
        ...(pendingUpdates[product.id] || {}),
        _pendingAction: pendingUpdates[product.id] ? "update" : "",
      })),
    ...pendingCreates.map((product) => ({
      ...product,
      _pendingAction: "create",
    })),
  ];

  const filteredProducts = stagedProducts
    .filter(p => {
      const query = searchQuery.toLowerCase();
      const catName = getCategoryDisplayName(p, categories);
      const matchesSearch = p.name.toLowerCase().includes(query) ||
        catName.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query));
      const matchesStock = stockFilter === "all" || getStockStatus(p) === stockFilter;
      const matchesDate = !dateFilter || getDateKey(p.createdAt || p.updatedAt) === dateFilter;

      return matchesSearch && matchesStock && matchesDate;
    })
    .sort((a, b) => {
      if (sortFilter === "newest") return getCreatedTime(b) - getCreatedTime(a);
      if (sortFilter === "oldest") return getCreatedTime(a) - getCreatedTime(b);
      if (sortFilter === "name-asc") return a.name.localeCompare(b.name);
      if (sortFilter === "name-desc") return b.name.localeCompare(a.name);
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
  }, [
    searchQuery,
    sortFilter,
    stockFilter,
    dateFilter,
    allProducts.length,
    pendingCreates.length,
    pendingDeletes.length,
  ]);

  const downloadProductsExcel = async () => {
    setExporting(true);
    await exportRowsToExcel({
      fileName: "products",
      sheetName: "Products",
      rows: filteredProducts,
      columns: [
        { header: "S.No.", width: 9, value: (_, index) => index + 1 },
        { header: "Product ID", width: 26, value: (product) => product.id },
        { header: "Product Name", width: 32, value: (product) => product.name },
        {
          header: "Category",
          width: 22,
          value: (product) => getCategoryDisplayName(product, categories),
        },
        { header: "Brand", width: 20, value: (product) => product.brand || "" },
        { header: "Selling Price", width: 16, value: (product) => Number(product.price) || 0 },
        { header: "MRP", width: 14, value: (product) => Number(product.mrp) || Number(product.price) || 0 },
        {
          header: "Discount %",
          width: 14,
          value: (product) => {
            const price = Number(product.price) || 0;
            const mrp = Number(product.mrp) || price;
            return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
          },
        },
        { header: "Stock", width: 12, value: (product) => Number(product.stock) || 0 },
        { header: "Bestseller", width: 14, value: (product) => product.bestseller ? "Yes" : "No" },
        {
          header: "Stock Status",
          width: 16,
          value: (product) =>
            ({ out: "Out of Stock", low: "Low Stock", in: "In Stock" })[
              getStockStatus(product)
            ],
        },
        { header: "Rating", width: 11, value: (product) => Number(product.rating) || 0 },
        { header: "Created Date", width: 17, value: (product) => formatCreatedDate(product.createdAt) },
      ],
    });
    setExporting(false);
  };

  const openAdd = () => {
    setForm({
      ...emptyForm,
      category: categories[0]?.id || "",
    });
    setImages([]);
    setImageFile(null);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name,
      category: p.category,
      brand: p.brand,
      price: String(p.price),
      mrp: String(p.mrp || p.price),
      sizes: p.variants && p.variants.length > 0 && p.variants[0].name === "Size" 
        ? p.variants[0].options.map(o => o.name || o).join(", ") 
        : "",
      variantOptions: p.variants && p.variants.length > 0 && p.variants[0].name === "Size" 
        ? p.variants[0].options.map(o => typeof o === 'string' ? { name: o, price: String(p.price), mrp: String(p.mrp || p.price) } : { ...o })
        : [],
      highlights: p.highlights ? p.highlights.join("\n") : "",
      description: p.description,
      stock: String(p.stock || 100),
      bestseller: Boolean(p.bestseller),
    });
    setImages(p.images && p.images.length > 0 ? [...p.images] : [p.image]);
    setImageFile(p.imageFile || null);
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleFiles = (fileList) => {
    const file = fileList[0];
    if (!file) return;
    
    // Open image in editor
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingImageSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedImage = async (croppedFile) => {
    setEditingImageSrc(null);
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(croppedFile);
      if (editingImageIndex !== null) {
        setImages((prev) => {
          const next = [...prev];
          next[editingImageIndex] = dataUrl;
          return next;
        });
        setEditingImageIndex(null);
      } else {
        setImages((prev) => [...prev, dataUrl]); // Append new images
      }
      if (!imageFile) setImageFile(croppedFile);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
  };
  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    
    const newImages = [...images];
    const draggedImg = newImages[dragItem.current];
    newImages.splice(dragItem.current, 1);
    newImages.splice(dragOverItem.current, 0, draggedImg);
    
    setImages(newImages);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const removeImage = (index) => {
    setImages((currentImages) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
    if (index === 0) setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert("Please enter a product description.");
      return;
    }
    if (!form.highlights.trim()) {
      alert("Please enter at least one product highlight.");
      return;
    }
    if (!editingId && !imageFile) {
      alert("Please select a product image!");
      return;
    }
    const categoryName = categories.find((category) => category.id === form.category)?.name || "";
    const payload = {
      ...form,
      price: Number(form.price),
      mrp: Number(form.mrp) || Number(form.price),
      stock: Number(form.stock) || 0,
      bestseller: Boolean(form.bestseller),
      categoryName,
      variants: form.variantOptions && form.variantOptions.length > 0 ? [{ 
        name: "Size", 
        options: form.variantOptions.map(opt => ({
          name: opt.name,
          price: Number(opt.price),
          mrp: Number(opt.mrp) || Number(opt.price)
        }))
      }] : undefined,
      highlights: form.highlights ? form.highlights.split("\n").map(h => h.trim()).filter(Boolean) : undefined,
      imageFile,
      image: images[0] || "",
      images: images.length > 0 ? images : [],
    };
    delete payload.sizes;
    delete payload.variantOptions;

    if (editingId) {
      if (isTempId(editingId)) {
        setPendingCreates((current) =>
          current.map((product) =>
            product.id === editingId ? { ...product, ...payload, id: editingId } : product,
          ),
        );
      } else {
        setPendingUpdates((current) => ({
          ...current,
          [editingId]: payload,
        }));
      }
    } else {
      setPendingCreates((current) => [
        ...current,
        {
          ...payload,
          id: `temp-product-${Date.now()}`,
          rating: 0,
          ratingCount: 0,
        },
      ]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (!confirm("Remove this product from the table? It will be deleted from DB only after Save Changes.")) {
      return;
    }

    if (isTempId(id)) {
      setPendingCreates((current) => current.filter((product) => product.id !== id));
      return;
    }

    setPendingUpdates((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setPendingDeletes((current) => (current.includes(id) ? current : [...current, id]));
  };

  const discardChanges = () => {
    setPendingCreates([]);
    setPendingUpdates({});
    setPendingDeletes([]);
  };

  const saveAllProductChanges = async () => {
    if (pendingChangesCount === 0) return;

    setSavingChanges(true);
    let nextCreates = [...pendingCreates];
    let nextUpdates = { ...pendingUpdates };
    let nextDeletes = [...pendingDeletes];
    const failures = [];

    for (const product of pendingCreates) {
      const result = await dispatch(createProduct(product));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Create ${product.name}: ${result.payload || "Unknown error"}`);
      } else {
        nextCreates = nextCreates.filter((item) => item.id !== product.id);
      }
    }

    for (const [id, patch] of Object.entries(pendingUpdates)) {
      const result = await dispatch(updateProduct({ id, patch }));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Update ${patch.name || id}: ${result.payload || "Unknown error"}`);
      } else {
        delete nextUpdates[id];
      }
    }

    for (const id of pendingDeletes) {
      const result = await dispatch(deleteProduct(id));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Delete ${id}: ${result.payload || "Unknown error"}`);
      } else {
        nextDeletes = nextDeletes.filter((item) => item !== id);
      }
    }

    setPendingCreates(nextCreates);
    setPendingUpdates(nextUpdates);
    setPendingDeletes(nextDeletes);
    setSavingChanges(false);

    if (failures.length > 0) {
      alert(`Some product changes could not be saved:\n${failures.join("\n")}`);
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
              id="admin-products-heading"
              kind="button"
              label="Products Page Heading"
              className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3"
            >
              Products Management
            </Editable>
            <Editable
              as="p"
              id="admin-products-subtext"
              kind="button"
              label="Products Page Subtext"
              className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed"
            >
              {allProducts.length} products listed in your spiritual storefront. Manage inventory, prices, and product details.
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
              onClick={saveAllProductChanges}
              disabled={pendingChangesCount === 0 || savingChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                pendingChangesCount > 0 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow" 
                  : "bg-white/10 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {savingChanges ? "Saving..." : `Save Changes${pendingChangesCount ? ` (${pendingChangesCount})` : ""}`}
            </button>
            <Editable
              as="button"
              kind="button"
              id="admin-add-product-btn"
              label="Add Product Button"
              onClick={openAdd}
              className="bg-white text-indigo-900 text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Add Product
            </Editable>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
              
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block p-2.5 transition-all outline-none shadow-sm hover:border-gray-300 flex-1 sm:w-36 cursor-pointer appearance-none"
              >
                <option value="all">All Stock Status</option>
                <option value="out">Out of Stock</option>
                <option value="low">Low Stock</option>
                <option value="in">In Stock</option>
              </select>
            </div>
            
            <div className="relative group flex-1 sm:w-40">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full p-2.5 transition-all outline-none shadow-sm hover:border-gray-300"
                aria-label="Filter products by created date"
              />
            </div>
          </div>
          
          <div className="shrink-0 flex items-center">
            <button
              type="button"
              onClick={downloadProductsExcel}
              disabled={exporting || filteredProducts.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} /> {exporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>
        </div>

      <Editable
        as="div"
        kind="button"
        id="admin-products-table-card"
        label="Products Table Card Background"
        className="bg-white rounded-md shadow-card overflow-x-auto"
      >
        <div className="overflow-x-auto p-0">
          <table className="w-full text-sm min-w-[950px]">
            <thead>
              <tr className="text-left bg-gray-50/50">
                <Editable as="th" group="admin-products-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs w-16">#</Editable>
                <Editable as="th" group="admin-products-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Product Details</Editable>
                <Editable as="th" group="admin-products-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Category</Editable>
                <Editable as="th" group="admin-products-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Pricing</Editable>
                <Editable as="th" group="admin-products-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Status</Editable>
                <Editable as="th" group="admin-products-col-header" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</Editable>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedProducts.map((p, index) => (
                <tr
                  key={p.id}
                  className={`group transition-all duration-200 ${
                    stockFilter === "low" && getStockStatus(p) === "low"
                      ? "bg-red-50/40 hover:bg-red-50/80"
                      : "hover:bg-indigo-50/40"
                  }`}
                >
                  <td className="py-4 px-6 font-bold text-gray-400">{pageStart + index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                        <img loading="lazy" src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 border border-black/5 rounded-xl"></div>
                      </div>
                      <div className="flex flex-col">
                        <Editable as="span" group="admin-products-name" kind="button" label="Product Name" className="text-gray-900 font-bold text-base group-hover:text-brand transition-colors line-clamp-1 max-w-[250px]">{p.name}</Editable>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-gray-500 font-medium">{formatCreatedDate(p.createdAt)}</span>
                           {p.rating > 0 && (
                             <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                               {p.rating.toFixed(1)} ★
                             </span>
                           )}
                        </div>
                        {p._pendingAction && (
                          <span className="mt-1.5 w-max inline-flex rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                            {p._pendingAction === "create" ? "Pending Creation" : "Pending Update"}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <Editable as="td" group="admin-products-category" kind="button" label="Product Category" className="py-4 px-6">
                    <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold capitalize border border-gray-200">
                      {getCategoryDisplayName(p, categories)}
                    </span>
                  </Editable>
                  <td className="py-4 px-6">
                    <div className="flex flex-col items-start gap-1">
                      <Editable as="span" group="admin-products-price" kind="button" label="Product Price" className="text-gray-900 font-bold text-base">
                        ₹{p.price.toLocaleString("en-IN")}
                      </Editable>
                      {p.mrp > p.price && (
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400 font-medium line-through">₹{p.mrp.toLocaleString("en-IN")}</span>
                           <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                             {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% Off
                           </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center">
                       {getStockStatus(p) === "in" && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>In Stock ({p.stock})</span>}
                       {getStockStatus(p) === "out" && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Out of Stock</span>}
                       {getStockStatus(p) === "low" && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>Low Stock ({p.stock})</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-brand hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                       <Search size={28} />
                     </div>
                     <p className="text-gray-500 text-base font-medium">No products found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{showingStart}</span> to <span className="font-bold text-gray-900">{showingEnd}</span> of <span className="font-bold text-gray-900">{filteredProducts.length}</span> products
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md w-full max-w-lg p-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <h2 className="font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                required
                placeholder="Product Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
              />
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand bg-white"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <div className="flex gap-3">
                <input
                  required
                  placeholder="Brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand flex-1"
                />
                <input
                  required
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand w-32"
                />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  required
                  type="number"
                  placeholder="Price (₹)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[120px] focus:outline-brand"
                />
                <input
                  type="number"
                  placeholder="MRP (₹)"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[120px] focus:outline-brand"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    placeholder="%"
                    value={
                      Number(form.mrp) > Number(form.price) && Number(form.price) > 0
                        ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)
                        : ""
                    }
                    onChange={(e) => {
                      const discount = Number(e.target.value);
                      if (Number(form.mrp) > 0 && discount >= 0 && discount < 100) {
                        const newPrice = Math.round(Number(form.mrp) - (Number(form.mrp) * (discount / 100)));
                        setForm({ ...form, price: newPrice });
                      }
                    }}
                    className="border border-green-300 rounded px-2 py-2 text-sm w-16 text-center text-green-700 bg-green-50 focus:outline-green-500 font-semibold"
                  />
                  <span className="text-xs font-semibold text-green-700">% Off</span>
                </div>
              </div>
              <input
                placeholder="Sizes (comma-separated, e.g. Small, Medium, Large)"
                value={form.sizes}
                onChange={(e) => {
                  const newSizes = e.target.value;
                  const newNames = newSizes.split(",").map(s => s.trim()).filter(Boolean);
                  
                  // Reconcile variantOptions
                  const newOptions = newNames.map(name => {
                    const existing = form.variantOptions.find(o => o.name === name);
                    return existing ? existing : { name, price: form.price, mrp: form.mrp };
                  });
                  
                  setForm({ ...form, sizes: newSizes, variantOptions: newOptions });
                }}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
              />

              <label className="flex items-center justify-between gap-4 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-700">Bestseller</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.bestseller)}
                  onChange={(e) => setForm({ ...form, bestseller: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
              </label>

              {form.variantOptions && form.variantOptions.length > 0 && (
                <div className="border border-gray-200 rounded-md p-3 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Size Prices (Optional)</p>
                  <div className="flex flex-col gap-2">
                    {form.variantOptions.map((opt, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-3 bg-white border border-gray-100 p-2 rounded">
                        <span className="text-sm font-medium text-gray-700 w-24 truncate">{opt.name}</span>
                        
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={opt.price}
                          onChange={(e) => {
                            const newOpts = [...form.variantOptions];
                            newOpts[i].price = e.target.value;
                            setForm({ ...form, variantOptions: newOpts });
                          }}
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 min-w-[80px] focus:outline-brand"
                        />
                        <input
                          type="number"
                          placeholder="MRP (₹)"
                          value={opt.mrp}
                          onChange={(e) => {
                            const newOpts = [...form.variantOptions];
                            newOpts[i].mrp = e.target.value;
                            setForm({ ...form, variantOptions: newOpts });
                          }}
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 min-w-[80px] focus:outline-brand"
                        />
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            placeholder="%"
                            value={
                              Number(opt.mrp) > Number(opt.price) && Number(opt.price) > 0
                                ? Math.round(((Number(opt.mrp) - Number(opt.price)) / Number(opt.mrp)) * 100)
                                : ""
                            }
                            onChange={(e) => {
                              const discount = Number(e.target.value);
                              if (Number(opt.mrp) > 0 && discount >= 0 && discount < 100) {
                                const newPrice = Math.round(Number(opt.mrp) - (Number(opt.mrp) * (discount / 100)));
                                const newOpts = [...form.variantOptions];
                                newOpts[i].price = newPrice;
                                setForm({ ...form, variantOptions: newOpts });
                              }
                            }}
                            className="border border-green-300 rounded px-1.5 py-1 text-sm w-12 text-center text-green-700 bg-green-50 focus:outline-green-500 font-semibold"
                          />
                          <span className="text-[10px] font-semibold text-green-700">% Off</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo manager */}
              <div className="border border-gray-200 rounded-md p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Product Photos</p>

                {images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {images.map((img, i) => (
                      <div 
                        key={i} 
                        className="relative group cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragEnter={(e) => handleDragEnter(e, i)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <img loading="lazy"
                          src={img}
                          alt={`Photo ${i + 1}`}
                          className="w-full aspect-square object-cover rounded border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingImageIndex(i);
                            setEditingImageSrc(img);
                          }}
                          aria-label="Edit photo"
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] rounded"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          aria-label="Remove photo"
                          className="absolute -top-1.5 -right-1.5 bg-maroon text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
                        >
                          <X size={11} />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 bg-brand text-white text-[9px] px-1 rounded-tr">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <ImageOff size={14} /> No photos added yet — a placeholder will be used.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center justify-center gap-1.5 border border-gray-300 rounded px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 w-full"
                  >
                    <Upload size={13} /> {uploading ? "Uploading..." : "Upload from device"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  First photo is used as the main listing image. Photos are resized automatically
                  before saving.
                </p>
              </div>

              <textarea
                placeholder="Product Highlights (one per line)"
                value={form.highlights}
                onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                rows={3}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
              />
              <Editable
                as="button"
                kind="button"
                id="admin-form-submit-btn"
                label="Form Submit Button"
                type="submit"
                className="bg-brand text-white font-semibold py-2.5 rounded-sm text-sm mt-1"
              >
                {editingId ? "Stage Changes" : "Add to Pending"}
              </Editable>
            </form>
          </div>
          {editingImageSrc && (
        <ImageEditorModal
          imageSrc={editingImageSrc}
          onSave={handleSaveEditedImage}
          onCancel={() => {
            setEditingImageSrc(null);
            setEditingImageIndex(null);
          }}
        />
      )}
    </div>
      )}
    </div>
  );
}
