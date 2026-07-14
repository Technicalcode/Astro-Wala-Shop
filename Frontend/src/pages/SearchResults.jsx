import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { searchProductsSelector } from "../store/productsSlice";
import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { SearchX } from "lucide-react";

const ITEMS_PER_PAGE = 8;

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const results = useSelector(searchProductsSelector(query));
  
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedList = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div className="bg-white rounded-md shadow-card p-4 mb-3">
        <p className="text-sm text-gray-600">
          Showing results for <span className="font-semibold text-gray-900">"{query}"</span> ({results.length} found)
        </p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-md shadow-card py-16 flex flex-col items-center gap-3">
          <SearchX size={44} className="text-gray-300" />
          <p className="text-gray-600">No products matched your search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paginatedList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
