import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useSelector } from "react-redux";
import { selectRecentlyViewed } from "../store/recentlyViewedSlice";
import Editable from "./editable/Editable";
import { COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../config/api";

export default function RecentlyViewedRail() {
  const recentlyViewed = useSelector(selectRecentlyViewed);
  if (!recentlyViewed || recentlyViewed.length === 0) return null;

  return (
    <Editable
      as="section"
      kind="button"
      id="recently-viewed-section"
      label="Recently Viewed Section Background"
      className="bg-white rounded-md shadow-card p-4 mt-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock size={15} className="text-brand" />
        <Editable as="h3" id="recently-viewed-heading" label="Recently Viewed Heading"
          className="font-display font-semibold text-base text-gray-900">
          Recently Viewed
        </Editable>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {recentlyViewed.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="shrink-0 w-28 group"
          >
            <div className="w-28 h-28 rounded-md overflow-hidden border border-gray-100 mb-1.5">
              <img
                src={toAssetUrl(p.images?.[0] || p.image, COMMON_CLOUDINARY_IMAGE_URL)}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = COMMON_CLOUDINARY_IMAGE_URL; }}
              />
            </div>
            <Editable as="p" group="recently-viewed-name" label="Recently Viewed Product Name"
              className="text-xs text-gray-700 line-clamp-2 leading-tight">
              {p.name}
            </Editable>
            <Editable as="p" group="recently-viewed-price" label="Recently Viewed Price"
              className="text-xs font-semibold text-brand mt-0.5">
              ₹{p.price?.toLocaleString("en-IN")}
            </Editable>
          </Link>
        ))}
      </div>
    </Editable>
  );
}
