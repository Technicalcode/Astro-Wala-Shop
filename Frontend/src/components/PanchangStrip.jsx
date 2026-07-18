import { memo, useState } from "react";
import { Sun, Moon, Clock, AlertTriangle } from "lucide-react";
import { todayPanchang, zodiacSigns, getDailyHoroscope } from "../data/panchang";
import Editable from "./editable/Editable";

function PanchangStrip() {
  const [activeSign, setActiveSign] = useState("aries");

  return (
    <div
      className="bg-gradient-to-r from-brand-dark via-[#1a1120] to-brand-dark rounded-xl overflow-hidden relative shadow-lg border border-gold-light/20"
    >
      {/* Subtle texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
      
      <div className="relative px-4 py-3 md:px-6 md:py-5">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Sun size={20} className="text-gold-light" />
            </div>
            <div>
              <Editable
                as="p"
                id="panchang-label"
                label="Panchang Label"
                className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-1"
              >
                Today's Panchang
              </Editable>
              <Editable
                as="p"
                id="panchang-date"
                label="Panchang Date"
                className="text-white font-display font-bold text-xl md:text-2xl drop-shadow-md"
              >
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Editable>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-5 gap-y-2 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm w-full lg:w-auto">
            <div className="flex flex-col gap-1">
              <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">Tithi</span>
              <span className="text-white font-medium text-sm">{todayPanchang.tithi}</span>
            </div>
            <div className="w-px bg-white/10 hidden md:block"></div>
            <div className="flex flex-col gap-1">
              <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">Nakshatra</span>
              <span className="text-white font-medium text-sm">{todayPanchang.nakshatra}</span>
            </div>
            <div className="w-px bg-white/10 hidden md:block"></div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"><Sun size={10} className="text-amber-400" /> Sunrise</span>
                <span className="text-white font-medium text-sm">{todayPanchang.sunrise}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"><Moon size={10} className="text-blue-300" /> Sunset</span>
                <span className="text-white font-medium text-sm">{todayPanchang.sunset}</span>
              </div>
            </div>
            <div className="w-px bg-white/10 hidden md:block"></div>
            <div className="flex flex-col gap-1">
              <span className="text-red-400/80 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"><AlertTriangle size={10} /> Rahu Kaal</span>
              <span className="text-red-200 font-medium text-sm">{todayPanchang.rahuKaal}</span>
            </div>
          </div>
        </div>

        {/* Horoscope Section */}
        <div className="pt-4 border-t border-white/10 relative mt-2">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-dark px-3 rounded-full border border-white/10">
            <Editable
              as="p"
              id="panchang-pick-label"
              label="Panchang Pick Sign Label"
              className="text-gold-light text-[10px] font-medium uppercase tracking-widest whitespace-nowrap"
            >
              Today's Quick Horoscope
            </Editable>
          </div>
          
          <div className="flex justify-start md:justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-3 px-2">
            {zodiacSigns.map((z) => {
              const isActive = activeSign === z.id;
              return (
                <button
                  key={z.id}
                  onClick={() => setActiveSign(z.id)}
                  className={`shrink-0 flex flex-col items-center justify-center w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-xl text-[10px] transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-b from-gold/20 to-gold/5 text-gold-light shadow-[0_0_15px_rgba(200,148,31,0.2)] border border-gold/50"
                      : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className={`text-xl sm:text-2xl mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    {z.symbol}
                  </span>
                  <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>
                    {z.name}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Horoscope Result Box */}
          <div className="mt-2 p-3 sm:p-4 rounded-xl bg-black/20 border border-white/5 backdrop-blur-md text-center max-w-3xl mx-auto shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
            <div className="flex items-center justify-center gap-3 relative z-10">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gold/10 text-gold-light flex items-center justify-center border border-gold/20">
                <span className="text-lg">{zodiacSigns.find(z => z.id === activeSign)?.symbol}</span>
              </div>
              <Editable
                as="p"
                id="panchang-horoscope"
                label="Daily Horoscope Text"
                className="text-white/90 text-xs sm:text-sm italic font-medium leading-relaxed"
              >
                "{getDailyHoroscope(activeSign)}"
              </Editable>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PanchangStrip);
