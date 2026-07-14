import { useState, useEffect } from "react";
import { Palette, Check, RotateCcw, Paintbrush, Pipette } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectBgColor, setBgColor, resetBgColor, DEFAULT_BG, saveBgColor } from "../../store/themeSlice";
import { themeColors } from "../../data/themeColors";

export default function AdminTheme() {
  const bgColor = useSelector(selectBgColor);
  const dispatch = useDispatch();
  const [customHex, setCustomHex] = useState(bgColor || "");

  useEffect(() => {
    if (bgColor) {
      setCustomHex(bgColor);
    }
  }, [bgColor]);

  const handleColorChange = (hex) => {
    dispatch(setBgColor(hex));
    dispatch(saveBgColor(hex));
  };

  const handleCustomHexSubmit = (e) => {
    e.preventDefault();
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    let formattedHex = customHex.trim();
    if (!formattedHex.startsWith("#")) {
      formattedHex = "#" + formattedHex;
    }
    // Expand 3-char hex to 6-char
    if (/^#[0-9A-Fa-f]{3}$/.test(formattedHex)) {
      formattedHex = "#" + formattedHex[1] + formattedHex[1] + formattedHex[2] + formattedHex[2] + formattedHex[3] + formattedHex[3];
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(formattedHex)) {
      handleColorChange(formattedHex);
      setCustomHex(formattedHex);
    } else {
      alert("Please enter a valid hex color code (e.g. #FF0000 or FF0000)");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-brand to-purple-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-2 flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                <Palette size={32} className="text-pink-300" />
              </div>
              Theme Customization
            </h1>
            <p className="text-indigo-100 max-w-xl text-base md:text-lg opacity-90 mt-2 leading-relaxed">
              Define the visual identity of your storefront. Choose a background color that resonates with your brand's spiritual essence.
            </p>
          </div>
          
          <div className="shrink-0 relative group">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div 
              className="relative w-24 h-24 rounded-2xl border-4 border-white/20 shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105"
              style={{ backgroundColor: bgColor || DEFAULT_BG }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-md">Live Preview</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-500/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-blue-400/20 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 p-6 md:p-10 space-y-12">
          
          {/* Custom Hex Code Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Pipette size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Custom Brand Color</h2>
                <p className="text-sm text-gray-500 font-medium">Have a specific hex code in mind? Enter it below.</p>
              </div>
            </div>
            
            <form onSubmit={handleCustomHexSubmit} className="flex gap-4 max-w-lg items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand">
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3 w-10 h-10 rounded-lg shadow-inner overflow-hidden border border-black/10 transition-transform hover:scale-105 cursor-pointer">
                   <input
                     type="color"
                     value={
                       customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex) 
                         ? customHex 
                         : (bgColor && /^#[0-9A-Fa-f]{6}$/.test(bgColor) ? bgColor : "#ffffff")
                     }
                     onChange={(e) => setCustomHex(e.target.value)}
                     className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                   />
                </div>
                <input
                  type="text"
                  placeholder="#HEXCODE"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-full bg-transparent border-none pl-16 pr-4 py-2 text-gray-900 font-mono font-medium text-base focus:ring-0 uppercase placeholder:text-gray-400 outline-none"
                  maxLength={7}
                />
              </div>
              <button 
                type="submit"
                className="bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
              >
                Apply Color
              </button>
            </form>
          </section>

          <hr className="border-gray-100/80" />

          {/* Predefined Palette Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                <Paintbrush size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Curated Pastels</h2>
                <p className="text-sm text-gray-500 font-medium">Select from our designer-approved spiritual palette.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-inner">
              {themeColors.map((c) => {
                const selected = bgColor?.toLowerCase() === c.hex.toLowerCase();
                return (
                  <div key={c.hex} className="relative group flex justify-center">
                    <button
                      onClick={() => handleColorChange(c.hex)}
                      aria-label={c.name}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        selected 
                          ? "border-brand shadow-lg scale-110 ring-4 ring-brand/20 z-10" 
                          : "border-black/5 hover:scale-110 hover:shadow-md hover:border-black/10"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selected && (
                        <Check
                          size={20}
                          className="absolute inset-0 m-auto text-gray-700 drop-shadow-md animate-in zoom-in duration-200"
                          strokeWidth={3.5}
                        />
                      )}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                      <span className="bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded whitespace-nowrap shadow-xl">
                        {c.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-gray-100/80" />

          {/* Reset Section */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-red-50/50 p-6 rounded-2xl border border-red-100 shadow-sm transition-colors hover:bg-red-50/80 gap-4">
              <div>
                <h3 className="text-base font-bold text-red-900 flex items-center gap-2">
                  <RotateCcw size={18} className="text-red-500" /> 
                  Revert to Default Theme
                </h3>
                <p className="text-sm text-red-700/80 mt-1 font-medium">Not happy with the changes? Instantly restore the original storefront appearance.</p>
              </div>
              <button
                onClick={() => handleColorChange(DEFAULT_BG)}
                disabled={bgColor === DEFAULT_BG}
                className="shrink-0 flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                Reset Theme
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
