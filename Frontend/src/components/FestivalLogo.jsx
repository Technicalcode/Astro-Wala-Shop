import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import { selectActiveFestival } from "../store/festivalSlice";
import Editable from "./editable/Editable";

export default function FestivalLogo() {
  const activeFestival = useSelector(selectActiveFestival);

  return (
    <div className="relative flex items-center shrink-0 order-1">
      <Link to="/" className="flex flex-col items-start">
        <Editable
          as="span"
          id="navbar-logo-text"
          label="Navbar Logo Text"
          isolate
          className="text-white font-display font-bold text-lg sm:text-2xl italic leading-none flex items-center gap-1.5"
        >
          {activeFestival ? (
            <span aria-hidden className="text-xl sm:text-2xl not-italic">
              {activeFestival.emoji}
            </span>
          ) : (
            <Sparkles size={18} className="text-gold-light shrink-0" />
          )}
          Astro<span className="text-gold-light">Wala Shop</span>
        </Editable>
        <Editable
          as="span"
          id="navbar-logo-tagline"
          label="Navbar Tagline"
          isolate
          className="text-[9px] sm:text-[10px] text-white/70 italic -mt-0.5 ml-0.5 hidden sm:block"
        >
          {activeFestival ? `Happy ${activeFestival.name}!` : "Cosmic shopping, on time"}
        </Editable>
      </Link>

      {activeFestival && (
        <span
          className={`absolute -top-2.5 -right-3 sm:-right-4 flex items-center gap-1 bg-gradient-to-r ${activeFestival.gradient} text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap animate-bounce`}
        >
          {activeFestival.emoji} {activeFestival.name} Special
        </span>
      )}
    </div>
  );
}
