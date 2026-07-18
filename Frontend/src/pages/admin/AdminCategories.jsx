import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X, FolderTree } from "lucide-react";
import * as Icons from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectCategories, createCategory, updateCategory, deleteCategory, fetchCategories } from "../../store/categoriesSlice";
import { fileToCompressedDataUrl } from "../../utils/imageUtils";
import Editable from "../../components/editable/Editable";
import { COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../../config/api";

const ImageEditorModal = lazy(() => import("../../components/ImageEditorModal"));

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

const isTempId = (id) => String(id || "").startsWith("temp-");

export default function AdminCategories() {
  const dispatch = useDispatch();
  const cats = useSelector(selectCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", tagline: "", color: "#000000", image: "", imageFile: null, bestseller: false });
  const [editingImageSrc, setEditingImageSrc] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("placeholder");
  const [dateFilter, setDateFilter] = useState("");
  const [pendingCreates, setPendingCreates] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [savingChanges, setSavingChanges] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(sessionStorage.getItem('adminCategoriesPage')) || 1;
  });

  useEffect(() => {
    sessionStorage.setItem('adminCategoriesPage', currentPage);
  }, [currentPage]);
  const isFirstRenderForPage = useRef(true);

  const pendingDeleteIds = new Set(pendingDeletes);
  const pendingChangesCount =
    pendingCreates.length + Object.keys(pendingUpdates).length + pendingDeletes.length;
  const stagedCats = [
    ...cats
      .filter((category) => !pendingDeleteIds.has(category.id))
      .map((category) => ({
        ...category,
        ...(pendingUpdates[category.id] || {}),
        _pendingAction: pendingUpdates[category.id] ? "update" : "",
      })),
    ...pendingCreates.map((category) => ({
      ...category,
      _pendingAction: "create",
    })),
  ];

  const filteredCats = stagedCats
    .filter(c => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(query) ||
        c.tagline.toLowerCase().includes(query);
      const matchesDate = !dateFilter || getDateKey(c.createdAt || c.updatedAt) === dateFilter;

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      if (sortFilter === "newest") return getCreatedTime(b) - getCreatedTime(a);
      if (sortFilter === "oldest") return getCreatedTime(a) - getCreatedTime(b);
      if (sortFilter === "name-asc") return a.name.localeCompare(b.name);
      if (sortFilter === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });
  const totalPages = Math.max(1, Math.ceil(filteredCats.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedCats = filteredCats.slice(pageStart, pageStart + PAGE_SIZE);
  const showingStart = filteredCats.length === 0 ? 0 : pageStart + 1;
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filteredCats.length);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (isFirstRenderForPage.current) {
      isFirstRenderForPage.current = false;
      return;
    }
    setCurrentPage(1);
  }, [
    searchQuery,
    sortFilter,
    dateFilter,
    cats.length,
    pendingCreates.length,
    pendingDeletes.length,
  ]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Open image in editor
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEditedImage = async (croppedFile) => {
    setEditingImageSrc(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(croppedFile);
      setForm({ ...form, image: dataUrl, imageFile: croppedFile });
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setForm({ id: "", name: "", tagline: "", color: "#2E6B5C", image: "", imageFile: null, bestseller: false });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({ ...c, bestseller: Boolean(c.bestseller), imageFile: c.imageFile || null });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!confirm("Remove this category from the table? It will be deleted from DB only after Save Changes.")) {
      return;
    }

    if (isTempId(id)) {
      setPendingCreates((current) => current.filter((category) => category.id !== id));
      return;
    }

    setPendingUpdates((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setPendingDeletes((current) => (current.includes(id) ? current : [...current, id]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      if (isTempId(editingId)) {
        setPendingCreates((current) =>
          current.map((category) =>
            category.id === editingId ? { ...category, ...form, id: editingId } : category,
          ),
        );
      } else {
        setPendingUpdates((current) => ({
          ...current,
          [editingId]: { ...form, id: editingId },
        }));
      }
    } else {
      setPendingCreates((current) => [
        ...current,
        {
          ...form,
          id: `temp-category-${Date.now()}`,
        },
      ]);
    }
    setShowForm(false);
  };

  const discardChanges = () => {
    setPendingCreates([]);
    setPendingUpdates({});
    setPendingDeletes([]);
  };

  const saveAllCategoryChanges = async () => {
    if (pendingChangesCount === 0) return;

    setSavingChanges(true);
    let nextCreates = [...pendingCreates];
    let nextUpdates = { ...pendingUpdates };
    let nextDeletes = [...pendingDeletes];
    const failures = [];

    for (const category of pendingCreates) {
      const result = await dispatch(createCategory(category));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Create ${category.name}: ${result.payload || "Unknown error"}`);
      } else {
        nextCreates = nextCreates.filter((item) => item.id !== category.id);
      }
    }

    for (const [id, category] of Object.entries(pendingUpdates)) {
      const result = await dispatch(updateCategory({ ...category, id }));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Update ${category.name || id}: ${result.payload || "Unknown error"}`);
      } else {
        delete nextUpdates[id];
      }
    }

    for (const id of pendingDeletes) {
      const result = await dispatch(deleteCategory(id));
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
      alert(`Some category changes could not be saved:\n${failures.join("\n")}`);
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Editable as="h1" id="admin-cat-heading" kind="button" label="Categories Heading" className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              Categories Management
            </Editable>
            <Editable as="p" id="admin-cat-sub" kind="button" label="Categories Subtext" className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
              {cats.length} active categories. Organize your products and control the store's taxonomy.
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
              onClick={saveAllCategoryChanges}
              disabled={pendingChangesCount === 0 || savingChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                pendingChangesCount > 0 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow" 
                  : "bg-white/10 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {savingChanges ? "Saving..." : `Save Changes${pendingChangesCount ? ` (${pendingChangesCount})` : ""}`}
            </button>
            <Editable as="button" onClick={openAdd} id="admin-add-cat-btn" kind="button" label="Add Category Button" className="bg-white text-indigo-900 text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <Plus size={18} /> Add Category
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
                <Icons.Search size={18} className="text-gray-400 group-focus-within:text-brand transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search categories..." 
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
            </div>
            
            <div className="relative group flex-1 sm:w-40">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full p-2.5 transition-all outline-none shadow-sm hover:border-gray-300"
                aria-label="Filter categories by created date"
              />
            </div>
          </div>
        </div>

      <Editable as="div" kind="button" id="admin-cat-table-card" label="Categories Table Card Background" className="overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left bg-gray-50/50">
              <Editable as="th" group="admin-cat-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs w-16">#</Editable>
              <Editable as="th" group="admin-cat-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Name</Editable>
              <Editable as="th" group="admin-cat-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Tagline</Editable>
              <Editable as="th" group="admin-cat-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Bestseller</Editable>
              <Editable as="th" group="admin-cat-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Theme Color</Editable>
              <Editable as="th" group="admin-cat-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Created Date</Editable>
              <Editable as="th" group="admin-cat-col" kind="button" label="Column Header" className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</Editable>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedCats.map((c, index) => (
              <tr key={c.id} className="group transition-all duration-200 hover:bg-indigo-50/40">
                <td className="py-4 px-6 font-bold text-gray-400">{pageStart + index + 1}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                      {c.image ? (
                        <img loading="lazy"
                          src={toAssetUrl(c.image, COMMON_CLOUDINARY_IMAGE_URL)}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = COMMON_CLOUDINARY_IMAGE_URL;
                          }}
                        />
                      ) : (
                        <FolderTree size={20} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <Editable as="span" group="admin-cat-name" kind="button" label="Category Name" className="font-bold text-base text-gray-900 group-hover:text-brand transition-colors">{c.name}</Editable>
                      {c._pendingAction && (
                        <span className="mt-1.5 w-max inline-flex rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                          {c._pendingAction === "create" ? "Pending Creation" : "Pending Update"}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <Editable as="td" group="admin-cat-tagline" kind="button" label="Category Tagline" className="py-4 px-6 text-gray-600 font-medium">{c.tagline}</Editable>
                <td className="py-4 px-6">
                  {c.bestseller ? (
                    <span className="inline-flex rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                      Bestseller
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400">No</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3 bg-gray-50/80 w-max px-3 py-1.5 rounded-lg border border-gray-100">
                    <div className="w-5 h-5 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: c.color }} />
                    <Editable as="span" group="admin-cat-color-text" kind="button" label="Category Color Text" className="text-gray-700 text-sm font-bold font-mono uppercase">{c.color}</Editable>
                  </div>
                </td>
                <Editable as="td" group="admin-cat-created" kind="button" label="Category Created Date" className="py-4 px-6 text-gray-500 text-sm font-medium whitespace-nowrap">
                  {formatCreatedDate(c.createdAt)}
                </Editable>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-brand hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCats.length === 0 && (
              <tr>
                <td colSpan="7" className="py-20 text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                     <Icons.Search size={28} />
                   </div>
                   <p className="text-gray-500 text-base font-medium">No categories found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredCats.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{showingStart}</span> to <span className="font-bold text-gray-900">{showingEnd}</span> of <span className="font-bold text-gray-900">{filteredCats.length}</span> categories
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Editable as="div" kind="button" id="admin-cat-modal-bg" label="Category Modal Background" className="bg-white rounded-md w-full max-w-sm p-5 relative shadow-xl">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h2 className="font-semibold text-gray-900 mb-4">{editingId ? "Edit Category" : "Add Category"}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
                <input required value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Theme Color</label>
                <div className="flex gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-9 h-9 p-0 border-0 rounded cursor-pointer" />
                  <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand font-mono" />
                </div>
              </div>
              <label className="flex items-center justify-between gap-4 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-700">Bestseller</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.bestseller)}
                  onChange={(e) => setForm({ ...form, bestseller: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
              </label>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category Image (Optional)</label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="flex items-center justify-center w-full border border-gray-300 rounded px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                      <Icons.Upload size={14} className="mr-2" /> Upload from device
                      <input type="file" accept="image/*" onChange={handleImageUpload} onClick={(e) => e.target.value = null} className="hidden" />
                    </label>
                  </div>
                  {form.image && (
                    <div className="relative group overflow-hidden rounded border border-gray-200 shrink-0">
                      <img loading="lazy" src={form.image} alt="Preview" className="w-10 h-10 object-cover" />
                      <button type="button" onClick={() => setEditingImageSrc(form.image)} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                        <Pencil size={12} />
                      </button>
                      <button type="button" onClick={() => setForm({...form, image: "", imageFile: null})} className="absolute -top-1.5 -right-1.5 bg-maroon text-white rounded-full w-4 h-4 flex items-center justify-center shadow">
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Editable as="button" id="admin-cat-save-btn" kind="button" label="Save Category Button" type="submit" className="bg-brand text-white font-semibold py-2 rounded-sm text-sm mt-2">
                {editingId ? "Stage Changes" : "Add to Pending"}
              </Editable>
            </form>
          </Editable>
        </div>
      )}

      {editingImageSrc && (
        <Suspense fallback={null}>
          <ImageEditorModal
            imageSrc={editingImageSrc}
            onSave={handleSaveEditedImage}
            onCancel={() => setEditingImageSrc(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
