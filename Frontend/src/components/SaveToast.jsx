import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

/**
 * SaveToast — bottom-center toast popup shown when a profile/settings save succeeds.
 * Props:
 *   show     {boolean}  — controls visibility
 *   onClose  {fn}       — called when the toast hides (to reset parent state)
 *   message  {string}   — optional custom message
 *   duration {number}   — ms before auto-hide (default 3500)
 */
export default function SaveToast({
  show,
  onClose,
  message = "Changes saved successfully!",
  duration = 3500,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
      style={{ animation: "saveToastIn 0.35s cubic-bezier(.4,0,.2,1)" }}
    >
      <div className="flex items-center gap-3 bg-[#1a2235] border border-green-400/30 text-white rounded-2xl px-5 py-3.5 shadow-2xl min-w-[280px] max-w-sm">
        {/* Green animated ring icon */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <span className="absolute inset-0 rounded-full border-2 border-green-400/40 animate-ping" />
        </div>

        <div className="flex-1">
          <p className="text-[11px] font-semibold text-green-400 mb-0.5">Success</p>
          <p className="text-sm font-bold leading-snug">{message}</p>
        </div>

        <button
          onClick={() => { setVisible(false); if (onClose) onClose(); }}
          className="shrink-0 text-white/30 hover:text-white/70 transition-colors ml-1"
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes saveToastIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
