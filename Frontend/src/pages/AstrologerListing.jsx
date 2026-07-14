import { Helmet } from "react-helmet-async";
import { useState, useMemo } from "react";
import { astrologers } from "../data/astrologers";
import AstrologerCard from "../components/AstrologerCard";
import Editable from "../components/editable/Editable";

const SPECIALIZATIONS = [
  "All",
  "Vedic",
  "Tarot",
  "Numerology",
  "Vastu",
  "KP System",
  "Career",
  "Love & Relationships",
];

export default function AstrologerListing() {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    if (filter === "All") return astrologers;
    return astrologers.filter((a) => a.specialization.includes(filter));
  }, [filter]);

  return (
    <div>
      <Helmet>
        <title>Talk to an Astrologer | AstroMart</title>
        <meta name="description" content="Get live, private 1:1 consultations on call or chat with top-rated Vedic astrologers, Tarot readers, and Numerologists." />
      </Helmet>
      <Editable
        as="div"
        kind="button"
        group="astrologer-frame"
        label="Astrologer Section Frame"
        className="bg-white rounded-md shadow-card p-5 mb-4"
      >
        <Editable as="h1" group="astrologer-frame-title" label="Astrologer Section Title" className="font-display font-semibold text-xl text-gray-900">
          Talk to an Astrologer
        </Editable>
        <Editable as="p" group="astrologer-frame-paragraph" label="Astrologer Section Paragraph" className="text-sm text-gray-500 mt-1">
          Live, private 1:1 consultations on call or chat — pay only for the minutes you use.
        </Editable>
      </Editable>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {SPECIALIZATIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border ${
              filter === s ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <AstrologerCard key={a.id} astrologer={a} />
        ))}
      </div>
    </div>
  );
}
