import { useState, useEffect } from "react";
import { Palette, X, Check, RotateCcw, Pencil } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../store/authSlice";
import { selectBgColor, setBgColor, resetBgColor, DEFAULT_BG, saveBgColor } from "../store/themeSlice";
import { selectEditMode, toggleEditMode } from "../store/editableStyleSlice";
import { themeColors } from "../data/themeColors";
import ColorEditPopover from "./editable/ColorEditPopover";

export default function AdminColorPicker() {
  const user = useSelector(selectUser);
  const bgColor = useSelector(selectBgColor);
  const editMode = useSelector(selectEditMode);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [customHex, setCustomHex] = useState(bgColor || "");
  const [showTooltip, setShowTooltip] = useState(true);

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

  // Hard gate: nothing in this component renders for anyone except a logged-in admin.
  if (!user || user.role !== "admin") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open site background color picker (admin only)"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-brand text-white px-1.5 py-3 rounded-r-md shadow-lg flex flex-col items-center gap-1.5 hover:bg-brand-dark transition-colors"
      >
        <Palette size={16} />
        <span className="text-[10px] font-semibold tracking-wide" style={{ writingMode: "vertical-rl" }}>
          Theme
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          <div className="relative h-full w-[min(360px,calc(100vw-16px))] bg-white shadow-2xl overflow-y-auto animate-[slideIn_0.2s_ease-out]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
              <h3 className="font-semibold text-gray-900 text-sm">Site Background</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900"
                aria-label="Close theme color picker"
                title="Close"
              >
                <X size={19} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 px-5 pt-5">
              Admin only — pick a color below or enter a hex code to change the storefront background for everyone.
            </p>

            <form onSubmit={handleCustomHexSubmit} className="mb-4 flex gap-2 items-center px-5">
              <div className="relative flex-1 flex items-center min-w-0">
                <input
                  type="color"
                  value={
                    customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex) 
                      ? customHex 
                      : (bgColor && /^#[0-9A-Fa-f]{6}$/.test(bgColor) ? bgColor : "#ffffff")
                  }
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="absolute left-0.5 w-7 h-7 cursor-pointer rounded border-0 bg-transparent p-0 shrink-0"
                />
                <input
                  type="text"
                  placeholder="#HEX"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-full border border-gray-300 rounded py-1 pl-8 pr-2 text-sm focus:outline-brand uppercase transition-colors"
                  maxLength={7}
                />
              </div>
              <button 
                type="submit"
                className="bg-brand text-white px-3 py-1 rounded text-sm hover:bg-brand-dark shrink-0 whitespace-nowrap"
              >
                Apply
              </button>
            </form>

            <div className="grid grid-cols-5 gap-2.5 mb-4 px-5">
              {themeColors.map((c) => {
                const selected = bgColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    onClick={() => handleColorChange(c.hex)}
                    title={c.name}
                    aria-label={c.name}
                    className="relative w-10 h-10 rounded-full border border-black/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.hex }}
                  >
                    {selected && (
                      <Check
                        size={16}
                        className="absolute inset-0 m-auto text-gray-700"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handleColorChange(DEFAULT_BG)}
              disabled={bgColor === DEFAULT_BG}
              className="mx-5 mb-5 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={13} /> Reset to default
            </button>
          </div>
        </div>
      )}

      {/* Element / group color editor — toggle + shared popover */}
      <div className="fixed right-3 top-40 z-40 flex items-center gap-2.5 bg-amber-50 border border-amber-200 px-3 py-2 rounded-full shadow-md">
        <Pencil size={13} className="text-amber-700" />
        <span className="text-xs font-semibold text-amber-700">Edit Mode</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={editMode}
            onChange={() => dispatch(toggleEditMode())}
            className="sr-only peer"
            aria-label="Toggle element color edit mode"
          />
          <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-amber-500 transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {editMode && showTooltip && (
        <div className="fixed right-3 top-52 z-40 max-w-[230px] bg-white border border-amber-200 text-[11px] text-amber-800 rounded-xl shadow-md px-3 py-2 pr-6 leading-relaxed">
          Double-click any highlighted text or button to edit. Turn this off when you're done.
          <button 
            onClick={() => setShowTooltip(false)}
            className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-700"
            aria-label="Close tooltip"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <ColorEditPopover />
    </>
  );
}
