import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAllProducts, selectProductsLoading } from "../store/productsSlice";
import { selectCategories } from "../store/categoriesSlice";
import ProductCard from "../components/ProductCard";
import Editable from "../components/editable/Editable";
import Pagination from "../components/Pagination";
import { ChevronRight, SlidersHorizontal, IndianRupee, Star, Tag, Layers } from "lucide-react";
import PageLoadingState from "../components/PageLoadingState";
import { getCategoryDisplayName } from "../utils/categoryDisplay";

const SORT_OPTIONS = [
  { id: "popularity", label: "Popularity" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
  { id: "rating", label: "Customer Rating" },
];

const ITEMS_PER_PAGE = 8;

export default function AllProducts() {
  const allProducts = useSelector(selectAllProducts);
  const categoryOptions = useSelector(selectCategories);
  const loading = useSelector(selectProductsLoading);

  const [sort, setSort] = useState("popularity");
  const [maxPrice, setMaxPrice] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const allBrands = useMemo(
    () => [...new Set(allProducts.map((p) => p.brand))],
    [allProducts]
  );
  
  const allCategories = useMemo(() => {
    const byId = new Map();
    allProducts.forEach((product) => {
      if (product.category) {
        byId.set(product.category, getCategoryDisplayName(product, categoryOptions));
      }
    });
    return [...byId].map(([id, name]) => ({ id, name }));
  }, [allProducts, categoryOptions]);

  const priceCeiling = useMemo(
    () => Math.max(20000, ...allProducts.map((product) => Number(product.price) || 0)),
    [allProducts],
  );

  const filtered = useMemo(() => {
    let list = allProducts.filter(
      (p) => (maxPrice === null || p.price <= maxPrice) &&
             p.rating >= minRating && 
             (brands.length === 0 || brands.includes(p.brand)) &&
             (categories.length === 0 || categories.includes(p.category))
    );
    if (sort === "popularity") list = [...list].sort((a, b) => b.ratingCount - a.ratingCount || b.rating - a.rating);
    if (sort === "price_low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price_high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [allProducts, sort, maxPrice, minRating, brands, categories]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedList = filtered.slice(
    0,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (
        window.innerHeight + scrollY + 200 >=
        document.documentElement.scrollHeight
      ) {
        if (!loadingMore && currentPage < totalPages) {
          setLoadingMore(true);
          setTimeout(() => {
            setCurrentPage(prev => prev + 1);
            setLoadingMore(false);
          }, 800);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, currentPage, totalPages]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sort, maxPrice, minRating, brands, categories]);

  const toggleBrand = (b) => {
    setBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };
  
  const toggleCategory = (c) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  if (loading && allProducts.length === 0) {
    return <PageLoadingState label="Loading products..." />;
  }

  return (
    <Editable as="div" kind="button" id="all-products-bg" label="All Products (Background & Text)">
      <Helmet>
        <title>All Products | AstroMart</title>
        <meta name="description" content="Browse our complete catalog of astrology products, gemstones, and spiritual items." />
      </Helmet>
      <Editable as="div" kind="button" id="all-products-breadcrumb" label="Breadcrumb" className="flex items-center gap-1 text-xs mb-3 text-gray-700">
        <Link to="/" className="opacity-70 hover:opacity-100 transition-opacity">Home</Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="font-medium">All Products</span>
      </Editable>

      <div className="flex flex-col md:flex-row gap-4">
        <Editable as="aside" id="all-products-filters-bg" kind="button" label="Filters Sidebar Background" className="w-full md:w-72 shrink-0 bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-fit">
          <Editable as="div" group="all-products-filters-header" kind="button" label="Filters Header" className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 text-gray-900">
            <div className="p-2 bg-brand/10 text-brand rounded-lg">
              <SlidersHorizontal size={20} />
            </div>
            <h4 className="font-display font-bold text-lg tracking-wide">Filters</h4>
          </Editable>

          <div className="mb-6">
            <Editable as="p" group="all-products-filters-title" kind="button" label="Filter Section Title" className="flex items-center gap-2 text-sm font-bold text-gray-800 tracking-wider uppercase mb-3">
              <Layers size={14} className="text-gray-500" /> Category
            </Editable>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {allCategories.map((category) => (
                <label key={category.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 cursor-pointer capitalize transition-colors">
                  <input
                    type="checkbox"
                    checked={categories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="accent-brand w-4 h-4 rounded border-gray-300"
                  />
                  <Editable as="span" group="all-products-filters-label" kind="button" label="Filter Label" className="flex-1 font-medium select-none">
                    {category.name}
                  </Editable>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6 pt-6 border-t border-gray-100">
            <Editable as="p" group="all-products-filters-title" kind="button" label="Filter Section Title" className="flex items-center gap-2 text-sm font-bold text-gray-800 tracking-wider uppercase mb-4">
              <IndianRupee size={14} className="text-gray-500" /> Price
            </Editable>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max={priceCeiling}
                step="100"
                value={maxPrice ?? priceCeiling}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #1A4B8C ${
                    priceCeiling ? ((maxPrice ?? priceCeiling) / priceCeiling) * 100 : 100
                  }%, #e5e7eb ${
                    priceCeiling ? ((maxPrice ?? priceCeiling) / priceCeiling) * 100 : 100
                  }%)`
                }}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500 font-medium">₹0</span>
                <Editable as="span" group="all-products-filters-text" kind="button" label="Filter Text" className="text-sm font-semibold text-brand bg-brand/10 px-3 py-1 rounded-full">
                  Up to ₹{(maxPrice ?? priceCeiling).toLocaleString("en-IN")}
                </Editable>
              </div>
            </div>
          </div>

          <div className="mb-6 pt-6 border-t border-gray-100">
            <Editable as="p" group="all-products-filters-title" kind="button" label="Filter Section Title" className="flex items-center gap-2 text-sm font-bold text-gray-800 tracking-wider uppercase mb-3">
              <Star size={14} className="text-gray-500" /> Customer Rating
            </Editable>
            <div className="flex flex-col gap-1">
              {[4, 3, 0].map((r) => (
                <label key={r} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === r}
                    onChange={() => setMinRating(r)}
                    className="accent-brand w-4 h-4"
                  />
                  <Editable as="span" group="all-products-filters-label" kind="button" label="Filter Label" className="flex-1 font-medium select-none flex items-center gap-1">
                    {r === 0 ? "All ratings" : <>{r}<Star size={12} className="fill-brand text-brand" /> & above</>}
                  </Editable>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <Editable as="p" group="all-products-filters-title" kind="button" label="Filter Section Title" className="flex items-center gap-2 text-sm font-bold text-gray-800 tracking-wider uppercase mb-3">
              <Tag size={14} className="text-gray-500" /> Brand
            </Editable>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {allBrands.map((b) => (
                <label key={b} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={brands.includes(b)}
                    onChange={() => toggleBrand(b)}
                    className="accent-brand w-4 h-4 rounded border-gray-300"
                  />
                  <Editable as="span" group="all-products-filters-label" kind="button" label="Filter Label" className="flex-1 font-medium select-none">
                    {b}
                  </Editable>
                </label>
              ))}
            </div>
          </div>
        </Editable>

        <section className="flex-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-gray-900">All Products</h1>
              <p className="text-sm text-gray-500 mt-1"><span className="font-semibold text-brand">{filtered.length}</span> products available</p>
            </div>
            <div className="flex items-center gap-3 text-sm overflow-x-auto custom-scrollbar max-w-full pb-1">
              <span className="text-gray-500 shrink-0 font-medium text-xs uppercase tracking-wider">Sort By</span>
              <div className="flex items-center gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSort(opt.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      sort === opt.id
                        ? "bg-brand text-white shadow-md border border-brand"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-md shadow-card p-10 text-center text-gray-500">
              No products match these filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {paginatedList.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {loadingMore && (
                <div className="flex justify-center py-6 mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Editable>
  );
}
