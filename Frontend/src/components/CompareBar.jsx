import { useNavigate } from "react-router-dom";
import { X, GitCompare } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectCompareList, clearCompare } from "../store/compareSlice";
import Editable from "./editable/Editable";

export default function CompareBar() {
  const dispatch = useDispatch();
  const compareList = useSelector(selectCompareList);
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        compareList.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Editable
        as="div"
        kind="button"
        id="compare-bar"
        label="Compare Bar Background"
        className="flex items-center gap-3 bg-brand text-white px-4 py-2.5 rounded-full shadow-2xl"
      >
        {/* Product avatars */}
        <div className="flex -space-x-2">
          {compareList.map((p) => (
            <img loading="lazy"
              key={p.id}
              src={p.images?.[0] || p.image}
              alt={p.name}
              title={p.name}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32?text=?"; }}
            />
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center text-white/50 text-[10px]">
              +
            </div>
          ))}
        </div>

        <Editable
          as="button"
          kind="button"
          id="compare-bar-btn"
          label="Compare Button"
          onClick={() => navigate("/compare")}
          className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          <GitCompare size={15} />
          Compare ({compareList.length})
        </Editable>

        <button
          onClick={() => dispatch(clearCompare())}
          aria-label="Clear compare list"
          className="ml-1 text-white/70 hover:text-white"
        >
          <X size={16} />
        </button>
      </Editable>
    </div>
  );
}
