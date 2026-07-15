import { Helmet } from "react-helmet-async";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, Truck, RotateCcw, ChevronRight, Check, Lock, Star, MapPin, Loader2, Heart, Share2, MessageCircle, Link2 } from "lucide-react";
import { selectProductById, selectProductsByCategory, selectProductsLoading } from "../store/productsSlice";
import { selectCategoryById } from "../store/categoriesSlice";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/cartSlice";
import { selectUser } from "../store/authSlice";
import {
  fetchProductReviews,
  fetchReviewEligibility,
  selectProductReviewState,
  selectReviewEligibility,
  selectReviewSaving,
  submitProductReview,
  updateReview,
} from "../store/reviewSlice";
import { backendUrl, COMMON_CLOUDINARY_IMAGE_URL, readApiResponse, trackedFetch } from "../config/api";
import StarRating from "../components/StarRating";
import ProductCard from "../components/ProductCard";
import Editable from "../components/editable/Editable";
import StickyCartBar from "../components/StickyCartBar";
import RecentlyViewedRail from "../components/RecentlyViewedRail";
import WishlistButton from "../components/WishlistButton";
import { trackProduct } from "../store/recentlyViewedSlice";
import { getCheckoutNavigationState } from "../utils/checkoutAddress";
import PageLoadingState from "../components/PageLoadingState";
import { showErrorPopup } from "../utils/notificationCenter";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const product = useSelector(selectProductById(id));
  const productsLoading = useSelector(selectProductsLoading);
  const productId = product?.id || id;
  const category = useSelector((state) => selectCategoryById(state, product?.category));
  const categoryProducts = useSelector(selectProductsByCategory(product?.category || ""));
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const reviewState = useSelector(selectProductReviewState(productId));
  const reviewEligibility = useSelector(selectReviewEligibility(productId));
  const reviewSaving = useSelector(selectReviewSaving);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [variantError, setVariantError] = useState("");
  const [checkingCheckout, setCheckingCheckout] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [deliveryError, setDeliveryError] = useState("");
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const sentinelRef = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Track this product in recently viewed on mount
  useEffect(() => {
    if (id) {
      fetch(`${backendUrl}/api/v1/product/product-id/${id}`).catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (product) dispatch(trackProduct(product));
  }, [product?.id]); // eslint-disable-line

  useEffect(() => {
    if (productId) dispatch(fetchProductReviews(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    if (user && productId) dispatch(fetchReviewEligibility(productId));
  }, [dispatch, user, productId]);

  useEffect(() => {
    if (reviewEligibility.review?.status !== "hidden" && reviewEligibility.review) {
      setReviewRating(reviewEligibility.review.rating);
      setReviewTitle(reviewEligibility.review.title || "");
      setReviewComment(reviewEligibility.review.comment);
    } else {
      setReviewRating(0);
      setReviewTitle("");
      setReviewComment("");
    }
  }, [
    productId,
    reviewEligibility.review?.id,
    reviewEligibility.review?.rating,
    reviewEligibility.review?.comment,
    reviewEligibility.review?.updatedAt,
  ]);

  useEffect(() => {
    setReviewNotice("");
    setDeliveryEstimate(null);
    setDeliveryError("");
  }, [productId]);

  if (!product && productsLoading) {
    return <PageLoadingState label="Loading product details..." />;
  }

  if (!product) {
    return <p className="text-gray-600 py-10 text-center">Product not found.</p>;
  }

  // Derive dynamic price based on selection
  const selectedSizeOpt = product.variants && product.variants.length > 0 && product.variants[0].name === "Size" && selectedVariants["Size"]
    ? product.variants[0].options.find(o => o.name === selectedVariants["Size"])
    : null;

  const displayPrice = selectedSizeOpt && selectedSizeOpt.price ? selectedSizeOpt.price : product.price;
  const displayMrp = selectedSizeOpt && selectedSizeOpt.mrp ? selectedSizeOpt.mrp : product.mrp;
  const discount = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;
  
  const currentStock = product.stock !== undefined ? product.stock : 25;
  const isOutOfStock = currentStock === 0;
  const reviews = reviewState.reviews || [];
  const displayRating = reviewState.ratingCount ? reviewState.rating : product.rating;
  const displayRatingCount = reviewState.ratingCount || product.ratingCount || 0;

  const related = categoryProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const requireLogin = () => navigate("/login", { state: { from: location.pathname } });

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out ${product.name} on Astro Wala Shop!\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  const handleDeliveryCheck = async (event) => {
    event.preventDefault();
    const normalizedPincode = pincode.trim();

    if (!/^[1-9][0-9]{5}$/.test(normalizedPincode)) {
      setDeliveryEstimate(null);
      setDeliveryError("Enter a valid 6-digit PIN code.");
      showErrorPopup("Enter a valid 6-digit Indian PIN code.", {
        title: "Invalid PIN code",
        details: "PIN codes cannot begin with 0.",
      });
      return;
    }

    setCheckingDelivery(true);
    setDeliveryError("");

    try {
      const response = await trackedFetch(
        `${backendUrl}/api/v1/product/${productId}/delivery-estimate?pincode=${normalizedPincode}`,
      );
      const data = await readApiResponse(response);

      if (!response.ok) {
        setDeliveryEstimate(null);
        setDeliveryError(data.message || "Delivery estimate is unavailable.");
        return;
      }

      setDeliveryEstimate(data.data);
    } catch (error) {
      setDeliveryEstimate(null);
      setDeliveryError(error.message || "Delivery estimate is unavailable.");
    } finally {
      setCheckingDelivery(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!user) return requireLogin();

    if (!reviewEligibility.canReview) {
      setReviewNotice("You can review this product only after buying it.");
      showErrorPopup("You can review this product only after buying it.", {
        title: "Review not available",
        details: `Product: ${product.name}`,
      });
      return;
    }

    if (!reviewRating) {
      setReviewNotice("Please select a rating.");
      showErrorPopup("Select a star rating before submitting your review.", {
        title: "Rating required",
      });
      return;
    }

    const reviewPayload = {
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
    };
    const result = reviewEligibility.review?.id
      ? await dispatch(updateReview({ id: reviewEligibility.review.id, ...reviewPayload }))
      : await dispatch(submitProductReview({ productId, ...reviewPayload }));

    if (result.type?.endsWith("/rejected")) {
      setReviewNotice(result.payload || "Could not save your review.");
      return;
    }

    if (result.payload?.review) {
      setReviewRating(result.payload.review.rating);
      setReviewTitle(result.payload.review.title || "");
      setReviewComment(result.payload.review.comment);
    }
    setReviewNotice("Your review has been saved.");
  };

  const handleAddToCart = async () => {
    if (!user) return requireLogin();
    
    // Check if variants are selected
    if (product.variants && product.variants.length > 0) {
      const missing = product.variants.find((v) => !selectedVariants[v.name]);
      if (missing) {
        setVariantError(`Please select a ${missing.name}`);
        return;
      }
    }
    setVariantError("");
    
    // Add to cart with variant info
    const productWithVariant = { ...product };
    productWithVariant.productId = product.id;
    if (Object.keys(selectedVariants).length > 0) {
      productWithVariant.id = `${product.id}-${Object.values(selectedVariants).join("-")}`;
      productWithVariant.selectedVariants = selectedVariants;
      
      if (selectedVariants["Size"] && product.variants?.[0]?.options) {
        const sizeVariant = product.variants[0].options.find(o => o.name === selectedVariants["Size"]);
        if (sizeVariant && sizeVariant.price) {
          productWithVariant.price = sizeVariant.price;
          productWithVariant.mrp = sizeVariant.mrp || sizeVariant.price;
        }
      }
    }
    
    const result = await dispatch(addToCart(productWithVariant));
    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Could not add product to cart.", {
        title: "Could not add item",
        details: `Product: ${product.name}`,
      });
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = async () => {
    if (!user) return requireLogin();
    if (checkingCheckout) return;
    
    if (product.variants && product.variants.length > 0) {
      const missing = product.variants.find((v) => !selectedVariants[v.name]);
      if (missing) {
        setVariantError(`Please select a ${missing.name}`);
        return;
      }
    }
    
    const productWithVariant = { ...product };
    productWithVariant.productId = product.id;
    if (Object.keys(selectedVariants).length > 0) {
      productWithVariant.id = `${product.id}-${Object.values(selectedVariants).join("-")}`;
      productWithVariant.selectedVariants = selectedVariants;
      
      if (selectedVariants["Size"] && product.variants?.[0]?.options) {
        const sizeVariant = product.variants[0].options.find(o => o.name === selectedVariants["Size"]);
        if (sizeVariant && sizeVariant.price) {
          productWithVariant.price = sizeVariant.price;
          productWithVariant.mrp = sizeVariant.mrp || sizeVariant.price;
        }
      }
    }

    setCheckingCheckout(true);
    try {
      const checkoutState = await getCheckoutNavigationState(user);
      const result = await dispatch(
        addToCart({ product: productWithVariant, skipCartDrawer: true }),
      );
      if (result.type?.endsWith("/rejected")) {
        showErrorPopup(result.payload || "Could not add product to cart.", {
          title: "Could not start checkout",
          details: `Product: ${product.name}`,
        });
        return;
      }
      navigate("/checkout", { state: checkoutState });
    } finally {
      setCheckingCheckout(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>{product.name} | AstroMart</title>
        <meta name="description" content={product.description?.substring(0, 150) + "..."} />
      </Helmet>
      {/* ── Breadcrumb ── */}
      <Editable as="div" id="pd-breadcrumb" kind="button" label="Breadcrumb Text"
        className="flex items-center gap-1 text-xs mb-3 flex-wrap text-gray-700">
        <Link to="/" className="opacity-70 hover:opacity-100 transition-opacity">Home</Link>
        <ChevronRight size={12} className="opacity-50" />
        <Link to={`/category/${product.category}`} className="opacity-70 hover:opacity-100 transition-opacity">
          {category?.name}
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="font-medium">{product.name}</span>
      </Editable>

      {/* ── Main Card ── */}
      <Editable as="div" id="pd-card-bg" kind="button" label="Main Card Background"
        className="bg-white rounded-md shadow-card p-5 flex flex-col md:flex-row gap-8">

        {/* ── Left: Image Frame ── */}
        <div className="md:w-[380px] shrink-0">
          <Editable as="div" id="pd-image-frame" kind="button" label="Image Frame Background"
            className="border border-gray-100 rounded-md p-4 mb-3">
            <img loading="lazy"
              src={product.images[activeImg]}
              alt={product.name}
              className="w-full aspect-square object-cover rounded"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = COMMON_CLOUDINARY_IMAGE_URL;
              }}
            />
          </Editable>

          {/* Thumbnails */}
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-16 h-16 rounded border-2 overflow-hidden ${
                  i === activeImg ? "border-brand" : "border-gray-200"
                }`}
              >
                <img loading="lazy"
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = COMMON_CLOUDINARY_IMAGE_URL;
                  }}
                />
              </button>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex flex-col gap-3 mt-6">
            <Editable as="button" kind="button" group="pd-btn-cart" label="Add to Cart Button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`font-semibold py-3 rounded-sm uppercase text-sm tracking-wide flex items-center justify-center gap-2 transition-colors ${isOutOfStock ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-cta-cart text-gray-900 hover:opacity-90"}`}>
              {isOutOfStock ? "Out of Stock" : (added ? <><Check size={16} />Added!</> : "Add to Cart")}
            </Editable>
            <Editable as="button" kind="button" group="pd-btn-buy" label="Buy Now Button"
              onClick={handleBuyNow}
              disabled={isOutOfStock || checkingCheckout}
              className={`font-semibold py-3 rounded-sm uppercase text-sm tracking-wide transition-colors ${isOutOfStock || checkingCheckout ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-cta-buy text-white hover:opacity-90"}`}>
              {isOutOfStock ? "Out of Stock" : checkingCheckout ? "Checking..." : "Buy Now"}
            </Editable>
            {!user && (
              <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1 -mt-1">
                <Lock size={11} /> Log in to add items to your cart
              </p>
            )}
          </div>
          {/* Sentinel for sticky bar */}
          <div ref={sentinelRef} className="h-px" />
        </div>

        {/* ── Right: Product Info ── */}
        <div className="flex-1 relative">
          
          <div className="absolute top-0 right-0 flex items-center gap-1 sm:gap-2 z-10">
            <WishlistButton 
              product={product} 
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
            />
            <div className="relative">
              <button 
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-brand rounded-full transition-all group" 
                title="Share"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <Share2 size={20} className="transition-transform group-active:scale-95" />
              </button>
              
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg rounded-xl p-2 flex flex-col gap-1 z-20 w-40 animate-in fade-in zoom-in duration-200">
                    <button onClick={handleShareWhatsApp} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors text-left w-full">
                      <MessageCircle size={16} /> WhatsApp
                    </button>
                    <button onClick={handleCopyLink} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left w-full">
                      {copied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />} 
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Brand */}
          <Editable as="p" id="pd-brand" kind="button" label="Brand Text"
            className="text-xs text-gray-500">
            {product.brand}
          </Editable>

          {/* Title */}
          <Editable as="h1" id="pd-title" kind="button" label="Product Title"
            className="text-xl font-display font-semibold text-gray-900 mt-1">
            {product.name}
          </Editable>

          {/* Rating badge */}
          <Editable as="div" id="pd-rating-badge" kind="button" label="Rating Badge"
            className="mt-2 inline-flex">
            <StarRating rating={displayRating} count={displayRatingCount} size={13} />
          </Editable>

          {/* Price row */}
          <div className="flex items-baseline gap-3 mt-4 transition-all duration-300">
            <Editable as="span" id="pd-price" kind="button" label="Sale Price"
              className="text-3xl font-semibold text-gray-900">
              ₹{displayPrice.toLocaleString("en-IN")}
            </Editable>
            {displayMrp > displayPrice && (
              <>
                <Editable as="span" id="pd-mrp" kind="button" label="MRP (strikethrough)"
                  className="text-gray-400 line-through">
                  ₹{displayMrp.toLocaleString("en-IN")}
                </Editable>
                <Editable as="span" id="pd-discount" kind="button" label="Discount % Text"
                  className="text-green-700 font-medium">
                  {discount}% off
                </Editable>
              </>
            )}
          </div>

          {product.digital && (
            <Editable as="p" id="pd-digital-note" kind="button" label="Digital Delivery Note"
              className="text-xs text-brand mt-1">
              Digital delivery — no shipping required
            </Editable>
          )}

          {!product.digital && (
            <div className="mt-5 max-w-md border-t border-gray-100 pt-4 pr-12 sm:pr-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <MapPin size={17} className="text-brand" /> Check delivery time
              </div>
              <form onSubmit={handleDeliveryCheck} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={pincode}
                  onChange={(event) => {
                    setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setDeliveryEstimate(null);
                    setDeliveryError("");
                  }}
                  placeholder="Enter PIN code"
                  aria-label="Delivery PIN code"
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={checkingDelivery}
                  className="min-w-[82px] rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {checkingDelivery ? <Loader2 size={17} className="mx-auto animate-spin" /> : "Check"}
                </button>
              </form>

              {deliveryError && (
                <p className="mt-2 text-xs text-red-600" role="alert">{deliveryError}</p>
              )}

              {deliveryEstimate && (
                <div className="mt-3 flex items-start gap-2 rounded bg-green-50 px-3 py-2.5 text-green-800">
                  <Truck size={17} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      Delivery in {deliveryEstimate.minDays}-{deliveryEstimate.maxDays} days
                    </p>
                    <p className="mt-0.5 text-xs">
                      Expected by {new Date(deliveryEstimate.latestDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              {product.variants.map((v) => (
                <div key={v.name} className="mb-4">
                  <Editable as="h3" group="pd-variant-title" kind="button" label="Variant Title"
                    className="text-sm font-medium text-gray-900 mb-2">
                    {v.name}
                  </Editable>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => {
                      const optName = typeof opt === 'string' ? opt : opt.name;
                      return (
                      <button
                        key={optName}
                        onClick={() => {
                          setSelectedVariants((prev) => ({ ...prev, [v.name]: optName }));
                          setVariantError("");
                        }}
                        className={`px-4 py-1.5 rounded-sm border text-sm transition-colors ${
                          selectedVariants[v.name] === optName
                            ? "border-brand bg-brand/5 text-brand font-medium"
                            : "border-gray-300 text-gray-700 hover:border-brand"
                        }`}
                      >
                        {optName}
                      </button>
                    )})}
                  </div>
                </div>
              ))}
              {variantError && <p className="text-sm text-red-600 mt-1">{variantError}</p>}
            </div>
          )}

          {/* Trust badges frame */}
          <Editable as="div" id="pd-trust-frame" kind="button" label="Trust Badges Frame"
            className="grid grid-cols-2 gap-3 mt-5 max-w-sm">
            <Editable as="div" group="pd-trust-text" kind="button" label="Trust Badge Text"
              className="flex items-center gap-2 text-xs text-gray-600">
              <ShieldCheck size={16} className="text-brand" /> Astro Wala Shop Assured
            </Editable>
            <Editable as="div" group="pd-trust-text" kind="button" label="Trust Badge Text"
              className="flex items-center gap-2 text-xs text-gray-600">
              <Truck size={16} className="text-brand" />
              {product.digital
                ? "Instant digital delivery"
                : deliveryEstimate
                  ? `Delivery in ${deliveryEstimate.minDays}-${deliveryEstimate.maxDays} days`
                  : "Check your PIN code for delivery time"}
            </Editable>
            <Editable as="div" group="pd-trust-text" kind="button" label="Trust Badge Text"
              className="flex items-center gap-2 text-xs text-gray-600">
              <RotateCcw size={16} className="text-brand" />
              {product.digital ? "No returns on digital items" : "7 day easy return"}
            </Editable>
          </Editable>

          {/* Highlights */}
          <div className="mt-6">
            <Editable as="h3" id="pd-highlights-title" kind="button" label="Highlights Heading"
              className="font-semibold text-gray-900 mb-2 text-sm">
              Highlights
            </Editable>
            <ul className="space-y-1.5">
              {product.highlights.map((h, i) => (
                <Editable as="li" key={i} group="pd-highlights-text" kind="button" label="Highlight Item"
                  className="text-sm text-gray-600 flex gap-2">
                  <span className="text-brand">•</span> {h}
                </Editable>
              ))}
            </ul>
          </div>

          {/* Description */}
          <div className="mt-6">
            <Editable as="h3" id="pd-desc-title" kind="button" label="Description Heading"
              className="font-semibold text-gray-900 mb-2 text-sm">
              Description
            </Editable>
            <Editable as="p" id="pd-desc-text" kind="button" label="Description Paragraph"
              className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </Editable>
          </div>

          {/* Mobile Buttons */}
          <div className="flex flex-col gap-3 mt-6 md:hidden">
            <Editable as="button" kind="button" group="pd-btn-cart" label="Add to Cart Button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`font-semibold py-3 rounded-sm uppercase text-sm tracking-wide flex items-center justify-center gap-2 transition-colors ${isOutOfStock ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-cta-cart text-gray-900 hover:opacity-90"}`}>
              {isOutOfStock ? "Out of Stock" : (added ? "Added!" : "Add to Cart")}
            </Editable>
            <Editable as="button" kind="button" group="pd-btn-buy" label="Buy Now Button"
              onClick={handleBuyNow}
              disabled={isOutOfStock || checkingCheckout}
              className={`font-semibold py-3 rounded-sm uppercase text-sm tracking-wide transition-colors ${isOutOfStock || checkingCheckout ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-cta-buy text-white hover:opacity-90"}`}>
              {isOutOfStock ? "Out of Stock" : checkingCheckout ? "Checking..." : "Buy Now"}
            </Editable>
            {!user && (
              <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1 -mt-1">
                <Lock size={11} /> Log in to add items to your cart
              </p>
            )}
          </div>
        </div>
      </Editable>

      {/* ── Reviews ── */}
      <Editable as="div" id="pd-reviews-card" kind="button" label="Reviews Background"
        className="bg-white rounded-md shadow-card p-5 mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 mb-4">
          <Editable as="h3" id="pd-reviews-title" kind="button" label="Reviews Heading"
            className="font-display font-semibold text-lg text-gray-900">
            Customer Reviews
          </Editable>
          <StarRating rating={displayRating} count={displayRatingCount} size={13} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {reviewState.loading ? (
              <p className="text-sm text-gray-500">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <Editable as="div" key={r.id} group="pd-review-item" kind="button" label="Review Item" className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={r.rating} size={13} showCount={false} />
                    <span className="text-sm font-medium text-gray-900 ml-2">{r.user}</span>
                    <span className="text-xs text-gray-500 ml-auto">{new Date(r.date).toLocaleDateString("en-IN")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-2">{r.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
                </Editable>
              ))
            )}
          </div>

          <div className="rounded border border-gray-100 bg-gray-50 p-4 h-fit">
            <h4 className="font-semibold text-gray-900 text-sm">
              {reviewEligibility.hasReviewed ? "Edit your review" : "Write a review"}
            </h4>

            {!user ? (
              <div className="mt-3 text-sm text-gray-600">
                <p>Log in after buying this product to write a review.</p>
                <button onClick={requireLogin} className="text-brand font-semibold mt-2 hover:underline">
                  Log in
                </button>
              </div>
            ) : !reviewEligibility.canReview ? (
              <p className="mt-3 text-sm text-gray-600">
                You can review this product only after buying it.
              </p>
            ) : (
              <form onSubmit={handleReviewSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Your rating</label>
                  <div className="flex gap-1.5" onMouseLeave={() => setReviewHover(0)}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = star <= (reviewHover || reviewRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHover(star)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 -m-1"
                          aria-label={`${star} star rating`}
                        >
                          <Star size={22} className={filled ? "text-gold fill-gold" : "text-gray-300"} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Review title</label>
                  <input
                    required
                    maxLength={120}
                    value={reviewTitle}
                    onChange={(event) => setReviewTitle(event.target.value)}
                    placeholder="Summarize your experience"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Your review</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Share your experience with this product"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand resize-none bg-white"
                  />
                </div>

                {reviewNotice && (
                  <p className={`text-xs ${reviewNotice.includes("saved") ? "text-green-700" : "text-red-600"}`}>
                    {reviewNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reviewSaving}
                  className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-sm hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {reviewSaving ? "Saving..." : reviewEligibility.hasReviewed ? "Update Review" : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </Editable>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <Editable as="div" id="pd-related-card" kind="button" label="Similar Products Card Background"
          className="bg-white rounded-md shadow-card p-5 mt-4">
          <Editable as="h3" id="pd-related-title" kind="button" label="Similar Products Heading"
            className="font-display font-semibold text-lg text-gray-900 mb-3">
            Similar Products
          </Editable>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Editable>
      )}

      {/* Recently Viewed Rail */}
      <RecentlyViewedRail />

      {/* Sticky bottom cart bar */}
      <StickyCartBar product={product} sentinelRef={sentinelRef} />
    </div>
  );
}
