import { lazy, Suspense, useEffect, useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createBanner,
  deleteBanner,
  fetchBanners,
  selectBannerError,
  selectBannerLoading,
  selectBannerSlides,
  updateBanner,
} from "../../store/bannerSlice";
import { fileToCompressedDataUrl } from "../../utils/imageUtils";

const ImageEditorModal = lazy(() => import("../../components/ImageEditorModal"));

const emptyForm = {
  title: "",
  titleColor: "#ffffff",
  subtitle: "",
  subtitleColor: "#f3f4f6",
  cta: "Shop Now",
  ctaBg: "#ffffff",
  ctaText: "#000000",
  to: "/",
  alignment: "bottom-center",
  overlayOpacity: 0,
  order: 0,
  isActive: true,
};

const alignmentOptions = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const getPreviewImage = (banner) => banner.rawBg || "";

export default function AdminBanners() {
  const dispatch = useDispatch();
  const loading = useSelector(selectBannerLoading);
  const error = useSelector(selectBannerError);
  const slides = useSelector(selectBannerSlides).filter((slide) => slide.id !== "fallback-banner");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingImageSrc, setEditingImageSrc] = useState(null);
  const [saving, setSaving] = useState(false);

  const [pendingCreates, setPendingCreates] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [savingChanges, setSavingChanges] = useState(false);

  const pendingDeleteIds = new Set(pendingDeletes);
  const pendingChangesCount = pendingCreates.length + Object.keys(pendingUpdates).length + pendingDeletes.length;

  const stagedBanners = [
    ...slides
      .filter((banner) => !pendingDeleteIds.has(banner.id))
      .map((banner) => ({
        ...banner,
        ...(pendingUpdates[banner.id] || {}),
        _pendingAction: pendingUpdates[banner.id] ? "update" : "",
      })),
    ...pendingCreates.map((banner) => ({
      ...banner,
      _pendingAction: "create",
    })),
  ].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  useEffect(() => {
    dispatch(fetchBanners({ includeInactive: true }));
  }, [dispatch]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setPreview("");
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || "",
      titleColor: banner.titleColor || "#ffffff",
      subtitle: banner.subtitle || "",
      subtitleColor: banner.subtitleColor || "#f3f4f6",
      cta: banner.cta || "",
      ctaBg: banner.ctaBg || "#ffffff",
      ctaText: banner.ctaText || "#000000",
      to: banner.to || "/",
      alignment: banner.alignment || "bottom-center",
      overlayOpacity: Number(banner.overlayOpacity) || 0,
      order: Number(banner.order) || 0,
      isActive: banner.isActive !== false,
    });
    setImageFile(null);
    setPreview(getPreviewImage(banner));
    setShowForm(true);
  };

  const handleImage = (file) => {
    if (!file) {
      setImageFile(null);
      setPreview("");
      return;
    }

    // Open image in editor
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingImageSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedImage = async (croppedFile) => {
    setEditingImageSrc(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(croppedFile, { maxSize: 2000 });
      setImageFile(croppedFile);
      setPreview(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId && !imageFile && !preview) {
      alert("Please upload a banner image.");
      return;
    }

    const payload = {
      ...form,
      overlayOpacity: Number(form.overlayOpacity) || 0,
      order: Number(form.order) || 0,
      imageFile,
      rawBg: preview || form.rawBg,
    };

    if (editingId) {
      if (String(editingId).startsWith("temp-")) {
        setPendingCreates((current) =>
          current.map((b) => (b.id === editingId ? { ...b, ...payload } : b)),
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
          id: `temp-banner-${Date.now()}`,
        },
      ]);
    }

    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this banner? It will be deleted from DB only after Save Changes.")) return;

    if (String(id).startsWith("temp-")) {
      setPendingCreates((current) => current.filter((b) => b.id !== id));
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

  const saveAllBannerChanges = async () => {
    if (pendingChangesCount === 0) return;

    setSavingChanges(true);
    let nextCreates = [...pendingCreates];
    let nextUpdates = { ...pendingUpdates };
    let nextDeletes = [...pendingDeletes];
    const failures = [];

    for (const banner of pendingCreates) {
      const payload = {
        form: { ...banner },
        imageFile: banner.imageFile,
      };
      delete payload.form.id;
      delete payload.form._pendingAction;
      delete payload.form.imageFile;
      delete payload.form.rawBg;

      const result = await dispatch(createBanner(payload));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Create ${banner.title}: ${result.payload || "Error"}`);
      } else {
        nextCreates = nextCreates.filter((b) => b.id !== banner.id);
      }
    }

    for (const [id, patch] of Object.entries(pendingUpdates)) {
      const payload = {
        form: { ...patch },
        imageFile: patch.imageFile,
      };
      delete payload.form.id;
      delete payload.form._pendingAction;
      delete payload.form.imageFile;
      delete payload.form.rawBg;

      const result = await dispatch(updateBanner({ id, ...payload }));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Update ${patch.title || id}: ${result.payload || "Error"}`);
      } else {
        delete nextUpdates[id];
      }
    }

    for (const id of pendingDeletes) {
      const result = await dispatch(deleteBanner(id));
      if (result.type?.endsWith("/rejected")) {
        failures.push(`Delete ${id}: ${result.payload || "Error"}`);
      } else {
        nextDeletes = nextDeletes.filter((item) => item !== id);
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
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              Homepage Banners
            </h1>
            <p className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
              Manage homepage carousel images, text, links, order, and visibility to keep your storefront fresh.
            </p>
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
              onClick={saveAllBannerChanges}
              disabled={pendingChangesCount === 0 || savingChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                pendingChangesCount > 0 
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow" 
                  : "bg-white/10 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {savingChanges ? "Saving..." : `Save Changes${pendingChangesCount > 0 ? ` (${pendingChangesCount})` : ""}`}
            </button>
            <button
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-brand hover:bg-gray-100 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus size={18} /> Create New Banner
            </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[850px]">
          <thead>
            <tr className="text-left bg-gray-50/50">
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Banner Visual</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Details</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Link Destination</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Display Order</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Status</th>
              <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500 font-medium">Loading banners...</td>
              </tr>
            ) : stagedBanners.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-20 text-center">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                     <ImageIcon size={28} />
                   </div>
                   <p className="text-gray-500 text-base font-medium">No banners created yet. Create one to get started.</p>
                </td>
              </tr>
            ) : (
              stagedBanners.map((banner) => (
                <tr key={banner.id} className="group transition-all duration-200 hover:bg-indigo-50/40">
                  <td className="py-4 px-6">
                    <div className="relative h-16 w-32 shrink-0 rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                      {getPreviewImage(banner) ? (
                        <img loading="lazy"
                          src={getPreviewImage(banner)}
                          alt={banner.title || "Banner"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="absolute inset-0 border border-black/5 rounded-xl"></div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-gray-900 text-base group-hover:text-brand transition-colors">{banner.title || "Untitled banner"}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{banner.subtitle || "No subtitle"}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-medium">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-gray-50 border border-gray-200 text-xs text-gray-600">
                      {banner.to || "/"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-brand font-bold shadow-sm">
                      {banner.order}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${banner.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${banner.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></div>
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(banner)} className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors" aria-label="Edit banner">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(banner.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete banner">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-md w-full max-w-3xl p-5 relative shadow-xl my-8">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close banner form"
            >
              <X size={18} />
            </button>
            <h2 className="font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Banner" : "Create Banner"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Banner Image {editingId ? "(optional)" : ""}
                </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImage(e.target.files?.[0])}
                    onClick={(e) => e.target.value = null}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                  />
                <div
                  className="mt-3 h-36 w-full rounded border border-gray-200 bg-cover bg-center bg-gray-100 flex items-center justify-center overflow-hidden relative group"
                  style={{ backgroundImage: preview ? `url('${preview}')` : "none" }}
                >
                  {!preview ? (
                    <span className="text-xs text-gray-400">No image selected</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingImageSrc(preview)}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2 font-medium text-sm backdrop-blur-[1px]"
                    >
                      <Pencil size={16} /> Edit Current Image
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title Color</label>
                <input type="color" name="titleColor" value={form.titleColor} onChange={handleChange} className="w-full h-10 border border-gray-300 rounded p-1" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
                <input name="subtitle" value={form.subtitle} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle Color</label>
                <input type="color" name="subtitleColor" value={form.subtitleColor} onChange={handleChange} className="w-full h-10 border border-gray-300 rounded p-1" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                <input name="cta" value={form.cta} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Button Link</label>
                <input name="to" value={form.to} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Button Background</label>
                <input type="color" name="ctaBg" value={form.ctaBg} onChange={handleChange} className="w-full h-10 border border-gray-300 rounded p-1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Button Text Color</label>
                <input type="color" name="ctaText" value={form.ctaText} onChange={handleChange} className="w-full h-10 border border-gray-300 rounded p-1" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Alignment</label>
                <select name="alignment" value={form.alignment} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                  {alignmentOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Overlay Opacity</label>
                <input type="number" min="0" max="100" name="overlayOpacity" value={form.overlayOpacity} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                <input type="number" name="order" value={form.order} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 mt-6 cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="accent-brand" />
                <span className="text-sm text-gray-700">Banner is active</span>
              </label>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-sm text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="bg-brand text-white font-semibold px-5 py-2 rounded-sm text-sm disabled:opacity-60">
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Form Modal (End) */}
      
      {editingImageSrc && (
        <Suspense fallback={null}>
          <ImageEditorModal
            imageSrc={editingImageSrc}
            defaultAspect="original" // Match the original banner dimensions exactly
            onSave={handleSaveEditedImage}
            onCancel={() => setEditingImageSrc(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
