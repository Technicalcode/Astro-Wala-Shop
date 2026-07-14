import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Editable from "./editable/Editable";

export default function ProductRail({ title, subtitle, products, viewAllTo, groupId }) {
  const railGroup = groupId ? `product-frame-${groupId}` : "product-frame";
  const titleGroup = groupId ? `product-frame-title-${groupId}` : "product-frame-title";
  const paragraphGroup = groupId ? `product-frame-paragraph-${groupId}` : "product-frame-paragraph";

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
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} compact groupId={groupId} />
        ))}
      </div>
    </Editable>
  );
}
