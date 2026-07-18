import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectAllProducts } from "../../store/productsSlice";
import { fetchWithAuth, backendUrl, readApiResponse } from "../../config/api";
import { TrendingUp, Search, Eye, Hash, Crown, Award, Medal, FileText } from "lucide-react";
import Editable from "../../components/editable/Editable";

const PAGE_SIZE = 10;
const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

// Helper to get rank icons/colors
const getRankStyle = (index) => {
  switch (index) {
    case 0: return { bg: "bg-amber-100", text: "text-amber-700", icon: <Crown size={16} /> }; // Gold
    case 1: return { bg: "bg-slate-200", text: "text-slate-700", icon: <Award size={16} /> }; // Silver
    case 2: return { bg: "bg-orange-100", text: "text-orange-800", icon: <Medal size={16} /> }; // Bronze
    default: return { bg: "bg-gray-100", text: "text-gray-600", icon: <Hash size={14} /> };
  }
};

export default function AdminMostViewed() {
  const [activeTab, setActiveTab] = useState("products"); // "products" | "pages"
  
  // --- Products State ---
  const allProducts = useSelector(selectAllProducts);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(() => parseInt(sessionStorage.getItem('adminMostViewedProductsPage')) || 1);
  const isFirstRenderForProductPage = useRef(true);

  // --- Pages State ---
  const [pageViews, setPageViews] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pageSearch, setPageSearch] = useState("");
  const [pagesPage, setPagesPage] = useState(() => parseInt(sessionStorage.getItem('adminMostViewedPagesPage')) || 1);
  const isFirstRenderForPagesPage = useRef(true);

  // --- Effects for Products ---
  useEffect(() => {
    sessionStorage.setItem('adminMostViewedProductsPage', productPage);
  }, [productPage]);

  useEffect(() => {
    if (isFirstRenderForProductPage.current) {
      isFirstRenderForProductPage.current = false;
      return;
    }
    setProductPage(1);
  }, [productSearch]);

  // --- Effects for Pages ---
  useEffect(() => {
    sessionStorage.setItem('adminMostViewedPagesPage', pagesPage);
  }, [pagesPage]);

  useEffect(() => {
    if (isFirstRenderForPagesPage.current) {
      isFirstRenderForPagesPage.current = false;
      return;
    }
    setPagesPage(1);
  }, [pageSearch]);

  useEffect(() => {
    fetchPageViews();
  }, []);

  const fetchPageViews = async () => {
    try {
      setPagesLoading(true);
      const res = await fetchWithAuth(`${backendUrl}/api/v1/analytics/page-views`);
      const data = await readApiResponse(res);
      if (res.ok && data.success) {
        setPageViews(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch page views", error);
    } finally {
      setPagesLoading(false);
    }
  };

  // --- Data Processing for Products ---
  const filteredProducts = [...allProducts]
    .filter((p) => p.viewCount > 0 && p.name.toLowerCase().includes(productSearch.toLowerCase()))
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safeProductPage = Math.min(productPage, totalProductPages);
  const productStart = (safeProductPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(productStart, productStart + PAGE_SIZE);
  const productShowingStart = filteredProducts.length === 0 ? 0 : productStart + 1;
  const productShowingEnd = Math.min(productStart + PAGE_SIZE, filteredProducts.length);

  // --- Data Processing for Pages ---
  const filteredPageViews = pageViews.filter(
    (p) => 
      p.path.toLowerCase().includes(pageSearch.toLowerCase()) || 
      p.name.toLowerCase().includes(pageSearch.toLowerCase())
  ).sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

  const totalPagesPages = Math.max(1, Math.ceil(filteredPageViews.length / PAGE_SIZE));
  const safePagesPage = Math.min(pagesPage, totalPagesPages);
  const pagesStart = (safePagesPage - 1) * PAGE_SIZE;
  const paginatedPages = filteredPageViews.slice(pagesStart, pagesStart + PAGE_SIZE);
  const pagesShowingStart = filteredPageViews.length === 0 ? 0 : pagesStart + 1;
  const pagesShowingEnd = Math.min(pagesStart + PAGE_SIZE, filteredPageViews.length);

  const isProducts = activeTab === "products";

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-brand to-indigo-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10">
          <Editable
            as="h1"
            id="admin-trending-page-heading"
            kind="button"
            label="Page Heading"
            className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3"
          >
            {isProducts ? <TrendingUp size={36} className="text-amber-400" /> : <Eye size={36} className="text-amber-400" />}
            {isProducts ? "Most Viewed Products" : "Most Viewed Pages"}
          </Editable>
          <Editable
            as="p"
            id="admin-trending-page-subtext"
            kind="button"
            label="Page Subtext"
            className="text-indigo-100 max-w-2xl text-base md:text-lg opacity-90 mb-6"
          >
            {isProducts 
              ? "Discover which spiritual items are capturing the most attention. Track your most popular products and analyze customer interest." 
              : "Track which pages on your website get the most traffic. Discover the navigation patterns of your visitors."}
          </Editable>

          {/* Custom Tabs */}
          <div className="flex bg-white/10 p-1.5 rounded-xl backdrop-blur-md w-fit border border-white/20">
             <button 
                onClick={() => setActiveTab("pages")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${!isProducts ? "bg-white text-brand shadow-md" : "text-white hover:bg-white/20"}`}
             >
                <Eye size={16} /> Viewed Pages
             </button>
             <button 
                onClick={() => setActiveTab("products")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${isProducts ? "bg-white text-brand shadow-md" : "text-white hover:bg-white/20"}`}
             >
                <TrendingUp size={16} /> Viewed Products
             </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute top-10 right-20 w-20 h-20 bg-amber-400/20 blur-2xl rounded-full pointer-events-none"></div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 bg-white/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-brand shadow-inner">
              {isProducts ? <Eye size={20} /> : <TrendingUp size={20} />}
            </div>
            <Editable
              as="h3"
              id="admin-trending-card-heading"
              kind="button"
              label="Card Heading"
              className="font-semibold text-gray-900 text-xl"
            >
              {isProducts ? "Trending Products List" : "Page Views Ranking"}
            </Editable>
          </div>
          
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none transition-colors group-focus-within:text-brand">
              <Search size={18} className="text-gray-400 group-focus-within:text-brand transition-colors" />
            </div>
            <input
              type="text"
              placeholder={isProducts ? "Search trending products..." : "Search by name or path..."}
              className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand block w-full pl-10 p-2.5 transition-all outline-none shadow-sm hover:border-gray-300"
              value={isProducts ? productSearch : pageSearch}
              onChange={(e) => isProducts ? setProductSearch(e.target.value) : setPageSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Table Area */}
        <div className="p-0">
          {/* --- PRODUCTS VIEW --- */}
          {isProducts && (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                    <Search size={36} />
                  </div>
                  <p className="text-gray-500 text-base font-medium">
                    {productSearch ? "No trending products match your search." : "No product views tracked yet. Data will appear here once visitors browse your catalog."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="text-left bg-gray-50/50">
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Rank</th>
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Product Details</th>
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Engagement</th>
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedProducts.map((product, index) => {
                        const rankIndex = productStart + index;
                        const rank = getRankStyle(rankIndex);
                        return (
                          <tr key={product.id || product._id} className="hover:bg-indigo-50/40 transition-colors group">
                            <td className="py-5 px-6 whitespace-nowrap">
                              <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm ${rank.bg} ${rank.text} shadow-sm border border-white/50 backdrop-blur-sm transition-transform group-hover:scale-105`}>
                                {rank.icon}
                                {rankIndex > 2 && <span className="ml-0.5">{rankIndex + 1}</span>}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                                  <img loading="lazy" src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  <div className="absolute inset-0 border border-black/5 rounded-xl"></div>
                                </div>
                                <div>
                                  <p className="text-gray-900 font-bold text-base group-hover:text-brand transition-colors line-clamp-1">{product.name}</p>
                                  <p className="text-gray-500 text-xs mt-0.5 font-medium uppercase tracking-wide">{product.categoryName || 'Uncategorized'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm border border-indigo-100 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-0.5">
                                <TrendingUp size={16} className="text-indigo-500" />
                                {product.viewCount.toLocaleString()} <span className="font-medium opacity-80 text-xs tracking-wide">VIEWS</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-right whitespace-nowrap">
                              <div className="inline-flex flex-col items-end">
                                <span className="text-gray-900 font-bold text-lg leading-tight">{formatCurrency(product.price)}</span>
                                <span className="text-gray-600 font-medium text-[10px] uppercase tracking-wider line-through">MRP {formatCurrency(product.mrp || product.price)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination Controls for Products */}
              {filteredProducts.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-sm text-gray-500 font-medium">
                    Showing {productShowingStart} to {productShowingEnd} of {filteredProducts.length} items
                  </span>
                  <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                      disabled={safeProductPage === 1}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      Previous
                    </button>
                    <span className="font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm text-sm">
                      Page {safeProductPage} of {totalProductPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProductPage((page) => Math.min(totalProductPages, page + 1))}
                      disabled={safeProductPage === totalProductPages}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* --- PAGES VIEW --- */}
          {!isProducts && (
            <>
              {pagesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                   <div className="w-12 h-12 border-4 border-indigo-100 border-t-brand rounded-full animate-spin mb-4"></div>
                   <p className="text-gray-500 font-medium">Loading page views data...</p>
                </div>
              ) : filteredPageViews.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4 text-gray-300 shadow-inner">
                    <Search size={36} />
                  </div>
                  <p className="text-gray-500 text-base font-medium">
                    {pageSearch ? "No pages found matching your search." : "No page views tracked yet. Data will appear as users navigate the site."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="text-left bg-gray-50/50">
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Rank</th>
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Page Name</th>
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Path (URL)</th>
                        <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Total Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedPages.map((page, index) => {
                        const rankIndex = pagesStart + index;
                        const rank = getRankStyle(rankIndex);
                        return (
                          <tr key={page._id} className="hover:bg-indigo-50/40 transition-colors group">
                            <td className="py-5 px-6 whitespace-nowrap">
                              <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm ${rank.bg} ${rank.text} shadow-sm border border-white/50 backdrop-blur-sm transition-transform group-hover:scale-105`}>
                                {rank.icon}
                                {rankIndex > 2 && <span className="ml-0.5">{rankIndex + 1}</span>}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-brand group-hover:bg-indigo-50 transition-colors">
                                     <FileText size={18} />
                                  </div>
                                  <span className="text-gray-900 font-bold text-base group-hover:text-brand transition-colors">{page.name}</span>
                               </div>
                            </td>
                            <td className="py-5 px-6">
                               <span className="text-gray-500 font-mono text-xs px-2.5 py-1 bg-gray-50 rounded-md border border-gray-100 group-hover:border-indigo-100 group-hover:bg-white transition-colors">{page.path}</span>
                            </td>
                            <td className="py-5 px-6 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-bold text-sm border border-indigo-100 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-0.5">
                                <TrendingUp size={16} className="text-indigo-500" />
                                {page.viewCount.toLocaleString()} <span className="font-medium opacity-80 text-xs tracking-wide">VIEWS</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination Controls for Pages */}
              {!pagesLoading && filteredPageViews.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-sm text-gray-500 font-medium">
                    Showing {pagesShowingStart} to {pagesShowingEnd} of {filteredPageViews.length} items
                  </span>
                  <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPagesPage((page) => Math.max(1, page - 1))}
                      disabled={safePagesPage === 1}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      Previous
                    </button>
                    <span className="font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm text-sm">
                      Page {safePagesPage} of {totalPagesPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPagesPage((page) => Math.min(totalPagesPages, page + 1))}
                      disabled={safePagesPage === totalPagesPages}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
