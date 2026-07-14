import { ChevronLeft, ChevronRight } from "lucide-react";
import Editable from "./editable/Editable";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Editable as="div" id="pagination-container" kind="button" label="Pagination Container" className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
            currentPage === p
              ? "bg-brand text-white border-brand border"
              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </Editable>
  );
}
