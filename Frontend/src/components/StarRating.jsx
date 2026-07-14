import { Star } from "lucide-react";
import Editable from "./editable/Editable";

export default function StarRating({ rating, count, size = 12, showCount = true }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Editable
        as="span"
        kind="button"
        group="product-card-rating"
        label="Rating"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold"
        style={{ backgroundColor: "#15803d", color: "#ffffff" }}
      >
        {rating.toFixed(1)}
        <Star size={size} fill="currentColor" strokeWidth={0} />
      </Editable>
      {showCount && count !== undefined && (
        <Editable
          as="span"
          group="product-card-rating-count"
          label="Rating Count"
          className="text-xs text-gray-500"
        >
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </Editable>
      )}
    </div>
  );
}
