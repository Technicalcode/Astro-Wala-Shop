import { Helmet } from "react-helmet-async";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import BannerCarousel from "../components/BannerCarousel";
import PanchangStrip from "../components/PanchangStrip";
import CategoryGrid from "../components/CategoryGrid";
import ProductRail from "../components/ProductRail";
import { useSelector } from "react-redux";
import { selectAllProducts, selectProductsLoading } from "../store/productsSlice";
import { selectCategories } from "../store/categoriesSlice";
import { backendUrl, readApiResponse, trackedFetch } from "../config/api";

const WhyChooseUs = lazy(() => import("../components/WhyChooseUs"));
const TestimonialsSection = lazy(() => import("../components/TestimonialsSection"));

export default function Home() {
  const allProducts = useSelector(selectAllProducts);
  const productsLoading = useSelector(selectProductsLoading);
  const categories = useSelector(selectCategories);
  const [bestsellerCategoryId, setBestsellerCategoryId] = useState("");
  const [visibleRails, setVisibleRails] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!productsLoading && categories.length > 0) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 1000); // Wait 1 second for smooth rendering
      return () => clearTimeout(timer);
    }
  }, [productsLoading, categories.length]);

  useEffect(() => {
    if (showLoader) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showLoader]);

  useEffect(() => {
    let ignore = false;

    const loadHomepageSettings = async () => {
      try {
        const res = await trackedFetch(`${backendUrl}/api/v1/homepage/settings`);
        const data = await readApiResponse(res);
        if (!ignore && res.ok) {
          setBestsellerCategoryId(data.data?.bestsellerCategoryId || "");
        }
      } catch {
        // The all-category rail remains available if settings cannot be loaded.
      }
    };

    loadHomepageSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const bestsellerCategory = useMemo(
    () => categories.find((category) => category.id === bestsellerCategoryId),
    [categories, bestsellerCategoryId],
  );

  const bestsellers = useMemo(
    () =>
      allProducts
        .filter(
          (product) =>
            product.bestseller &&
            (!bestsellerCategoryId || product.category === bestsellerCategoryId),
        )
        .slice(0, 10),
    [allProducts, bestsellerCategoryId],
  );

  const productsByCategory = useMemo(() => {
    const groupedProducts = new Map();

    allProducts.forEach((product) => {
      if (!groupedProducts.has(product.category)) {
        groupedProducts.set(product.category, []);
      }
      groupedProducts.get(product.category).push(product);
    });

    return groupedProducts;
  }, [allProducts]);

  const categoryRails = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          products: productsByCategory.get(category.id) || [],
        }))
        .filter(
          (category) =>
            category.products.length > 0 && category.id !== bestsellerCategoryId,
        ),
    [categories, productsByCategory, bestsellerCategoryId],
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (
        window.innerHeight + scrollY + 200 >=
        document.documentElement.scrollHeight
      ) {
        if (!loadingMore && visibleRails < categoryRails.length) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleRails(prev => prev + 2);
            setLoadingMore(false);
          }, 800);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, visibleRails, categoryRails.length]);

  return (
    <>
      {showLoader && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-opacity duration-500">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-brand/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-brand text-2xl font-serif">ॐ</span>
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-dark animate-pulse tracking-wide">Astro Wala Shop</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Aligning the stars for you...</p>
        </div>
      )}
      <div className={`flex flex-col gap-4 transition-opacity duration-1000 ${showLoader ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100'}`}>
      <Helmet>
        <title>AstroMart - Buy Authentic Gemstones, Rudraksha & Astrology Consultations</title>
        <meta name="description" content="Shop for certified gemstones, rudraksha, yantras, pooja samagri and book live astrologer consultations at AstroMart." />
      </Helmet>
      <BannerCarousel />
      <CategoryGrid />
      <PanchangStrip />

      {bestsellers.length > 0 && (
        <ProductRail
          title={
            bestsellerCategory
              ? `Bestsellers in ${bestsellerCategory.name}`
              : "Bestsellers Across Astro Wala Shop"
          }
          subtitle={
            bestsellerCategory?.tagline || "Most-loved picks from every category"
          }
          products={bestsellers}
          viewAllTo={
            bestsellerCategory ? `/category/${bestsellerCategory.id}` : "/products"
          }
          groupId="bestsellers"
        />
      )}

      {categoryRails.slice(0, visibleRails).map((category) => (
        <ProductRail
          key={category.id}
          title={category.name}
          subtitle={category.tagline}
          products={category.products}
          viewAllTo={`/category/${category.id}`}
          groupId={category.id}
        />
      ))}

      {visibleRails < categoryRails.length ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 border-4 border-brand/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-900 font-medium tracking-wide">Loading more collections...</p>
        </div>
      ) : (
        <Suspense fallback={null}>
          <WhyChooseUs />
          <TestimonialsSection />
        </Suspense>
      )}
      </div>
    </>
  );
}
