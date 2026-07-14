import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AstrologerCard from "./AstrologerCard";
import Editable from "./editable/Editable";

export default function AstrologerRail({ title, subtitle, astrologers, viewAllTo }) {
  return (
    <Editable
      as="div"
      kind="button"
      group="astrologer-frame"
      label="Astrologer Section Frame"
      className="bg-white rounded-md shadow-card p-4 md:p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <Editable
            as="h3"
            group="astrologer-frame-title"
            label="Astrologer Section Title"
            className="font-display font-semibold text-lg text-gray-900"
          >
            {title}
          </Editable>
          {subtitle && (
            <Editable as="p" group="astrologer-frame-paragraph" label="Astrologer Section Paragraph" className="text-xs text-gray-500">
              {subtitle}
            </Editable>
          )}
        </div>
        {viewAllTo && (
          <Link
            to={viewAllTo}
            className="text-brand text-sm font-medium flex items-center gap-0.5 hover:underline"
          >
            View All <ChevronRight size={15} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {astrologers.map((a) => (
          <AstrologerCard key={a.id} astrologer={a} />
        ))}
      </div>
    </Editable>
  );
}
