import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, MessageSquare, Search, Star, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Editable from "../../components/editable/Editable";
import { fetchProducts, selectAllProducts } from "../../store/productsSlice";
import {
  backendUrl,
  COMMON_CLOUDINARY_IMAGE_URL,
  fetchWithAuth,
  readApiResponse,
  toAssetUrl,
} from "../../config/api";

const PLACEHOLDER = COMMON_CLOUDINARY_IMAGE_URL;

const toImageUrl = (image) => toAssetUrl(image, PLACEHOLDER);

const statusConfig = {
  all: "All",
  published: "Published",
  hidden: "Hidden",
};

export default function AdminReviews() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const [reviews, setReviews] = useState([]);
  const [productId, setProductId] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const selectedProductName = useMemo(() => {
    if (productId === "all") return "All products";
    return products.find((product) => product.id === productId)?.name || "Selected product";
  }, [productId, products]);

  const loadReviews = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (productId !== "all") params.set("productId", productId);
      if (status !== "all") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const query = params.toString();
      const res = await fetchWithAuth(
        `${backendUrl}/api/v1/review/admin/all${query ? `?${query}` : ""}`,
      );
      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch reviews");
      }

      setReviews(data.reviews || []);
    } catch (err) {
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length === 0) dispatch(fetchProducts());
  }, [dispatch, products.length]);

  useEffect(() => {
    loadReviews();
  }, [productId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadReviews();
  };

  const handleStatusUpdate = async (reviewId, nextStatus) => {
    try {
      const res = await fetchWithAuth(
        `${backendUrl}/api/v1/review/admin/${reviewId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to update review");
      }

      setReviews((current) => {
        const updated = current.map((review) =>
          review.id === reviewId ? data.review : review,
        );

        if (status === "all" || data.review.status === status) return updated;

        return updated.filter((review) => review.id !== reviewId);
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (review) => {
    if (!confirm(`Delete the review "${review.title || "Customer Review"}"?`)) return;

    setDeletingId(review.id);
    try {
      const res = await fetchWithAuth(
        `${backendUrl}/api/v1/review/admin/${review.id}`,
        { method: "DELETE" },
      );
      const data = await readApiResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to delete review");
      setReviews((current) => current.filter((item) => item.id !== review.id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div>
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl mb-8 mt-2">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Editable
              as="h1"
              id="admin-reviews-heading"
              kind="button"
              label="Reviews Heading"
              className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3"
            >
              Product Reviews
            </Editable>
            <Editable
              as="p"
              id="admin-reviews-sub"
              kind="button"
              label="Reviews Subtext"
              className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 leading-relaxed"
            >
              View customer reviews connected to purchased products.
            </Editable>
          </div>
          <div className="shrink-0 flex items-center bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl shadow-inner">
            <div className="text-indigo-50">
              Showing <span className="font-bold text-white text-lg mx-1">{reviews.length}</span> reviews for <br/> <span className="font-medium opacity-90">{selectedProductName}</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-5 mb-8 grid gap-4 lg:grid-cols-[1fr_220px_220px] items-center relative z-20">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, user, brand, or review"
            className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block pl-12 p-3 transition-all outline-none shadow-sm hover:border-gray-300"
          />
        </form>

        <div className="relative">
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3 transition-all outline-none shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
          >
            <option value="all">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block px-4 py-3 transition-all outline-none shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
          >
            {Object.entries(statusConfig).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-20 text-center text-gray-500 font-medium">
            <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading product reviews...
          </div>
        ) : error ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-20 text-center text-red-600 font-medium">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-24 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-5 text-gray-300 shadow-inner">
              <MessageSquare size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Reviews Found</h3>
            <p className="text-gray-500">We couldn't find any reviews matching your criteria.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Editable key={review.id} as="div" kind="button" group="admin-review-card" label="Review Card Background" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex gap-4 lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
                  <div className="relative shrink-0">
                    <img loading="lazy"
                      src={toImageUrl(review.productImage)}
                      alt={review.productName}
                      className="w-24 h-24 rounded-xl object-cover border border-gray-100 shadow-sm"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="font-bold text-gray-900 text-base line-clamp-2 leading-tight">{review.productName || "Deleted product"}</p>
                    <p className="text-xs font-semibold text-brand uppercase tracking-wider mt-2">{review.productBrand || "No brand"}</p>
                    {review.productCategory && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {review.productCategory}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {(review.userEmail || review.user).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{review.userEmail || review.user}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                      {new Date(review.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                      review.status === "published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${review.status === "published" ? "bg-emerald-500" : "bg-red-500"}`}></div>
                      {review.status === "published" ? "PUBLISHED" : "HIDDEN"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-4 bg-orange-50/50 w-fit px-3 py-1.5 rounded-lg border border-orange-100/50">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className={star <= review.rating ? "fill-orange-400 text-orange-400 drop-shadow-sm" : "fill-gray-200 text-gray-200"} />
                    ))}
                    <span className="ml-2 text-sm font-bold text-orange-700">{review.rating}.0</span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      {review.title || "Customer Review"}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:w-36 lg:pl-6 lg:border-l border-gray-100 justify-center">
                  {review.status === "published" ? (
                    <button
                      onClick={() => handleStatusUpdate(review.id, "hidden")}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-700 hover:text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                    >
                      <EyeOff size={16} /> Hide
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusUpdate(review.id, "published")}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                    >
                      <Eye size={16} /> Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review)}
                    disabled={deletingId === review.id}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-700 hover:text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:cursor-wait disabled:opacity-60"
                  >
                    <Trash2 size={16} /> {deletingId === review.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </Editable>
          ))
        )}
      </div>
    </div>
  );
}
