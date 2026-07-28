import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanners, normalizeBannerStyles, selectBannerSlides } from "../store/bannerSlice";
import Editable from "./editable/Editable";

const fontFamilyMap = {
  default: undefined,
  serif: "Georgia, Cambria, Times New Roman, serif",
  sans: "Inter, ui-sans-serif, system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const fontWeightMap = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const toTextStyle = (style = {}) => ({
  fontFamily: fontFamilyMap[style.fontFamily],
  fontSize: `${Number(style.fontSize) || 16}px`,
  fontWeight: fontWeightMap[style.fontWeight] || 400,
  fontStyle: style.fontStyle || "normal",
  color: style.textColor,
});

function BannerCarousel() {
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);
  const slides = useSelector(selectBannerSlides);

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  const activeIndex = slides.length > 0 ? index % slides.length : 0;

  const getAlignmentClasses = (align) => {
    switch (align) {
      case "top-left": return "justify-start items-start pt-6 sm:pt-10 pl-6 sm:pl-10 text-left";
      case "top-center": return "justify-start items-center pt-6 sm:pt-10 text-center";
      case "top-right": return "justify-start items-end pt-6 sm:pt-10 pr-6 sm:pr-10 text-right";
      case "center-left": return "justify-center items-start pl-6 sm:pl-10 text-left";
      case "center": return "justify-center items-center text-center";
      case "center-right": return "justify-center items-end pr-6 sm:pr-10 text-right";
      case "bottom-left": return "justify-end items-start pb-6 sm:pb-10 pl-6 sm:pl-10 text-left";
      case "bottom-right": return "justify-end items-end pb-6 sm:pb-10 pr-6 sm:pr-10 text-right";
      case "bottom-center":
      default:
        return "justify-end items-center pb-6 sm:pb-10 text-center";
    }
  };

  return (
    <div className="relative rounded-md overflow-hidden h-48 sm:h-64 md:h-80 lg:h-[400px] group bg-gray-100">
      <div className="absolute inset-0">
        {slides.map((slide, i) => {
          const active = i === activeIndex;
          const slideStyles = normalizeBannerStyles(slide.styles, slide);
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 flex flex-col transition-opacity duration-700 ease-in-out will-change-opacity ${
                active ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
              } ${getAlignmentClasses(slide?.alignment)}`}
            >
              <div
                className={`absolute inset-0 bg-cover bg-top transition-transform duration-[10000ms] ease-linear ${
                  active ? "scale-100 group-hover:scale-110" : "scale-105"
                }`}
                style={{ backgroundImage: slide.bg }}
              />
              {/* Removed dark overlay so the baked-in text shines clearly */}
              <div
                className="absolute inset-0 bg-black transition-opacity duration-700 ease-in-out"
                style={{ opacity: (slide?.overlayOpacity || 0) / 100 }}
              />
              <div className={`relative z-10 w-full flex flex-col transition-all duration-700 ease-out ${
                active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              } ${slide?.alignment?.includes('left') ? 'items-start' : slide?.alignment?.includes('right') ? 'items-end' : 'items-center'}`}>
                {slide?.title && (
                  <Editable
                    as="h2"
                    group="banner-title"
                    label="Banner Slide Title"
                    className="font-display font-bold text-2xl md:text-4xl mb-2 drop-shadow-md"
                    style={toTextStyle(slideStyles.title)}
                  >
                    {slide.title}
                  </Editable>
                )}
                {slide?.subtitle && (
                  <Editable
                    as="p"
                    group="banner-subtitle"
                    label="Banner Slide Subtitle"
                    className="text-sm md:text-base mb-4 drop-shadow-md"
                    style={toTextStyle(slideStyles.subtitle)}
                  >
                    {slide.subtitle}
                  </Editable>
                )}
                {slide?.cta && (
                  <Editable
                    as={Link}
                    to={slide.to || "/"}
                    kind="button"
                    group="banner-cta"
                    label="Banner CTA Button"
                    className="inline-block text-xs sm:text-base font-bold px-5 py-2 sm:px-8 sm:py-3 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    style={{ ...toTextStyle(slideStyles.cta), backgroundColor: slide.ctaBg || "#ffffff" }}
                  >
                    {slide.cta}
                  </Editable>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex z-10">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                className="flex h-11 w-11 items-center justify-center rounded-full"
                aria-label={`Go to slide ${i + 1}`}
              >
                <span
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(BannerCarousel);
