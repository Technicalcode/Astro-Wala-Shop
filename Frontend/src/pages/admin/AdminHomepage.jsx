import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Save, LayoutTemplate, Star } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCategories } from "../../store/categoriesSlice";
import { selectAllProducts } from "../../store/productsSlice";
import {
  backendUrl,
  fetchWithAuth,
  readApiResponse,
  trackedFetch,
} from "../../config/api";

export default function AdminHomepage() {
  const categories = useSelector(selectCategories);
  const products = useSelector(selectAllProducts);
  const [savedCategoryId, setSavedCategoryId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCount = useMemo(
    () =>
      selectedCategoryId
        ? products.filter((product) => product.category === selectedCategoryId).length
        : products.length,
    [products, selectedCategoryId],
  );

  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      try {
        const res = await trackedFetch(`${backendUrl}/api/v1/homepage/settings`);
        const data = await readApiResponse(res);
        if (!res.ok) throw new Error(data.message || "Failed to load homepage settings");
        if (!ignore) {
          const categoryId = data.data?.bestsellerCategoryId || "";
          setSavedCategoryId(categoryId);
          setSelectedCategoryId(categoryId);
        }
      } catch (loadError) {
        if (!ignore) setError(loadError.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const saveSettings = async () => {
    if (saving || selectedCategoryId === savedCategoryId) return;
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/admin/homepage/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bestsellerCategoryId: selectedCategoryId }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to save homepage settings");
      const categoryId = data.data?.bestsellerCategoryId || "";
      setSavedCategoryId(categoryId);
      setSelectedCategoryId(categoryId);
      setMessage("Homepage bestseller category saved successfully.");
      
      // Auto dismiss success message after 3s
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                <Star size={32} className="text-yellow-400" fill="currentColor" />
              </div>
              Bestseller category
            </h1>
            <p className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 mt-2 leading-relaxed">
              Curate the featured products on your storefront. Select which category of items you want to highlight in the homepage bestseller rail.
            </p>
          </div>
          
          <div className="shrink-0 relative hidden md:block opacity-80">
             <LayoutTemplate size={80} className="text-white/20" />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-500/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-blue-400/20 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 p-6 md:p-10">
          
          <div className="max-w-2xl">
            <label htmlFor="homepage-bestseller-category" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
              <Star size={18} className="text-brand" />
              Select Category for Homepage
            </label>
            
            <div className="relative group">
              <select
                id="homepage-bestseller-category"
                value={selectedCategoryId}
                onChange={(event) => {
                  setSelectedCategoryId(event.target.value);
                  setMessage("");
                  setError("");
                }}
                disabled={loading || saving}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm px-4 py-3.5 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow group-hover:border-gray-300"
              >
                <option value="">All Categories (Default)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {/* Custom Dropdown Arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-brand transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
               <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
               <p className="text-sm font-medium text-indigo-900/80">
                 <span className="font-bold text-brand">{selectedCount}</span> matching {selectedCount === 1 ? "product" : "products"}. Up to 10 will be showcased.
               </p>
            </div>

            {error && (
               <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50/80 p-4 border border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  <p className="text-sm font-medium text-red-800">{error}</p>
               </div>
            )}
            
            {message && (
               <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50/80 p-4 border border-emerald-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  <p className="text-sm font-medium text-emerald-800">{message}</p>
               </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={saveSettings}
                disabled={loading || saving || selectedCategoryId === savedCategoryId}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-brand-dark hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none w-full sm:w-auto"
              >
                {saving ? (
                   <>
                     <LoaderCircle size={20} className="animate-spin" />
                     Saving Changes...
                   </>
                ) : (
                   <>
                     <Save size={20} />
                     {selectedCategoryId === savedCategoryId && !loading ? "Saved" : "Save Settings"}
                   </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
