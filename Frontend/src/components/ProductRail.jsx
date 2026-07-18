import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronsRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Editable from "./editable/Editable";

function ProductRail({ title, subtitle, products, viewAllTo, groupId }) {
  const scrollRef = useRef(null);
  const railGroup = groupId ? `product-frame-${groupId}` : "product-frame";
  const titleGroup = groupId ? `product-frame-title-${groupId}` : "product-frame-title";
  const paragraphGroup = groupId ? `product-frame-paragraph-${groupId}` : "product-frame-paragraph";

  const scrollToNextProducts = () => {
    const rail = scrollRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: Math.max(rail.clientWidth - 80, 180),
      behavior: "smooth",
    });
  };

  return (
    <Editable
      as="div"
      kind="button"
      group={railGroup}
      label="Product Section Frame"
      className="bg-white rounded-md shadow-card p-4 md:p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <Editable
            as="h3"
            group={titleGroup}
            label="Product Section Title"
            className="font-display font-semibold text-lg text-gray-900"
          >
            {title}
          </Editable>
          {subtitle && (
            <Editable as="p" group={paragraphGroup} label="Product Section Paragraph" className="text-xs text-gray-500">
              {subtitle}
            </Editable>
          )}
        </div>
        {viewAllTo && (
          <Editable
            as={Link}
            to={viewAllTo}
            group={groupId ? `product-frame-viewall-${groupId}` : "product-frame-viewall"}
            label="View All Link"
            className="text-brand text-sm font-medium flex items-center gap-0.5 hover:underline"
          >
            View All <ChevronRight size={15} />
          </Editable>
        )}
      </div>
      <div className="relative">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-1">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} compact groupId={groupId} />
          ))}
        </div>
        {products.length > 1 && (
          <button
            type="button"
            onClick={scrollToNextProducts}
            title="Show more products"
            aria-label="Show more products"
            className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-900 shadow-md transition hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <ChevronsRight size={22} />
          </button>
        )}
      </div>
    </Editable>
  );
}

export default memo(ProductRail);
