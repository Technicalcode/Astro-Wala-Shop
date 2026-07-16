import { Link } from "react-router-dom";
import { ShieldCheck, GitCompare } from "lucide-react";
import StarRating from "./StarRating";
import Editable from "./editable/Editable";
import WishlistButton from "./WishlistButton";
import { useSelector, useDispatch } from "react-redux";
import { selectCompareList, selectCanAddMoreCompare, toggleCompare } from "../store/compareSlice";
import { COMMON_CLOUDINARY_IMAGE_URL } from "../config/api";

export default function ProductCard({ product, compact = false, groupId }) {
  const dispatch = useDispatch();
  const compareList = useSelector(selectCompareList);
  const canAddMore = useSelector(selectCanAddMoreCompare);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const comparing = compareList.some((p) => p.id === product.id);

  const bgGroup = groupId ? `product-card-bg-${groupId}` : "product-card-bg";
  const textGroup = groupId ? `product-card-text-${groupId}` : "product-card-text";
  const priceGroup = groupId ? `product-card-price-text-${groupId}` : "product-card-price-text";
  const mrpGroup = groupId ? `product-card-mrp-${groupId}` : "product-card-mrp";
  const discountGroup = groupId ? `product-card-discount-${groupId}` : "product-card-discount";
  const assuredGroup = groupId ? `product-card-assured-text-${groupId}` : "product-card-assured-text";

  return (
    <div className={`relative group bg-white rounded-sm border border-gray-100 hover:shadow-lg transition-shadow flex flex-col ${compact ? "w-[145px] sm:w-[180px] shrink-0" : "w-full"}`}>

      {/* Wishlist heart — top right */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton product={product} groupId={groupId} />
      </div>

      <Editable
        as={Link}
        to={`/product/${product.id}`}
        kind="button"
        group={bgGroup}
        label="Product Card Background"
        className="flex flex-col flex-1"
        isolate
      >
        <div className="relative p-3 pb-0">
          {product.bestseller && (
            <span className="absolute top-2 left-2 bg-maroon text-white text-[10px] font-semibold px-2 py-0.5 rounded z-20">
              Bestseller
            </span>
          )}
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-square object-cover rounded group-hover:scale-[1.03] transition-transform"
            loading="lazy"
            onError={(e) => { e.target.onerror = null; e.target.src = COMMON_CLOUDINARY_IMAGE_URL; }}
          />
          {/* Compare toggle — bottom left of image */}
          <button
            onClick={(e) => { e.preventDefault(); dispatch(toggleCompare(product)); }}
            title={comparing ? "Remove from compare" : canAddMore ? "Add to compare" : "Max 3 products"}
            className={`absolute bottom-2 left-4 z-20 h-7 w-7 rounded-full shadow flex items-center justify-center transition-all ${
              comparing ? "bg-brand text-white" : canAddMore ? "bg-white/90 text-gray-400 hover:text-brand opacity-0 group-hover:opacity-100" : "bg-white/90 text-gray-300 cursor-not-allowed opacity-0 group-hover:opacity-100"
            }`}
          >
            <GitCompare size={13} />
          </button>
        </div>
        <div className="p-3 pt-2 flex flex-col gap-1 flex-1">
          <Editable as="p" group={textGroup} kind="button" label="Product Text"
            className="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </Editable>
          <StarRating rating={product.rating} count={product.ratingCount} />
          <div className="flex items-baseline gap-2 mt-0.5">
            <Editable as="span" group={priceGroup} kind="button" label="Price" className="font-semibold text-gray-900">
              ₹{product.price.toLocaleString("en-IN")}
            </Editable>
            {product.mrp > product.price && (
              <>
                <Editable as="span" group={mrpGroup} kind="button" label="MRP" className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString("en-IN")}</Editable>
                <Editable as="span" group={discountGroup} kind="button" label="Discount"
                  className="text-xs font-medium" style={{ color: "#15803d" }}>
                  {discount}% off
                </Editable>
              </>
            )}
          </div>
          {product.assured && (
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck size={13} className="text-brand" />
              <Editable as="span" group={assuredGroup} kind="button" label="Assured Text" className="text-[11px] text-gray-500">Astro Wala Shop Assured</Editable>
            </div>
          )}
        </div>
      </Editable>
    </div>
  );
}
