import { memo, useRef, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { useSelector } from "react-redux";
import { selectCategories, selectCategoriesLoading } from "../store/categoriesSlice";
import Editable from "./editable/Editable";
import { COMMON_CLOUDINARY_IMAGE_URL } from "../config/api";
import PageLoadingState from "./PageLoadingState";

function CategoryGrid() {
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectCategoriesLoading);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scrollBy = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.bestseller === b.bestseller) return 0;
        return a.bestseller ? -1 : 1;
      }),
    [categories],
  );

  if (loading && categories.length === 0) {
    return <PageLoadingState label="Loading categories..." />;
  }

  const isScrollableMobile = sortedCategories.length > 12;
  const mobileGridClasses = isScrollableMobile 
    ? "grid-rows-3 grid-flow-col overflow-x-auto" 
    : "grid-cols-4";
  const mobileGridStyles = isScrollableMobile 
    ? { gridAutoColumns: 'calc(25% - 0.375rem)' } 
    : {};

  return (
    <Editable
      as="div"
      id="categorygrid-card"
      kind="button"
      label="Category Grid — Card Background"
      className="rounded-md shadow-card px-2 md:px-8 py-6 bg-white overflow-hidden relative group/grid"
    >
      {canScrollLeft && (
        <button 
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollBy(-400)}
          className={`absolute left-1 md:left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] text-gray-700 hover:text-brand hover:border-brand z-10 transition-all md:opacity-0 md:group-hover/grid:opacity-100 ${isScrollableMobile ? 'flex' : 'hidden md:flex'}`}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className={`grid ${mobileGridClasses} md:flex md:flex-nowrap md:overflow-x-auto gap-y-6 gap-x-2 md:gap-6 w-full no-scrollbar snap-x pb-2 justify-items-center`}
        style={mobileGridStyles}
      >
        {sortedCategories.map((c) => {
          const Icon = Icons[c.icon] || Icons.Sparkles;
          return (
            <Link
              key={c.id}
              to={c.id === "consultation" ? "/astrologers" : `/category/${c.id}`}
              className="flex flex-col items-center gap-2 md:gap-3 group shrink-0 snap-start w-full md:w-24"
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex flex-col items-center justify-center overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
                style={{ backgroundColor: c.image ? 'transparent' : `${c.color}1A` }}
              >
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = COMMON_CLOUDINARY_IMAGE_URL;
                    }}
                  />
                ) : (
                  <Icon size={24} style={{ color: c.color }} className="group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
              <Editable
                as="span"
                group="categorygrid-label"
                kind="button"
                label="Category Label"
                className="text-xs md:text-sm font-semibold text-center leading-tight max-w-full text-gray-800 rounded px-1"
              >
                {c.name}
              </Editable>
            </Link>
          );
        })}
      </div>

      {canScrollRight && (
        <button 
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollBy(400)}
          className={`absolute right-1 md:right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] text-gray-700 hover:text-brand hover:border-brand z-10 transition-all md:opacity-0 md:group-hover/grid:opacity-100 ${isScrollableMobile ? 'flex' : 'hidden md:flex'}`}
        >
          <ChevronRight size={20} />
        </button>
      )}
    </Editable>
  );
}

export default memo(CategoryGrid);
