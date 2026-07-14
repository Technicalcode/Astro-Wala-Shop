import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Paintbrush, Link2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPopover,
  selectStyle,
  selectGroupCount,
  closePopover,
  setColor,
  setBackground,
  resetStyle,
} from "../../store/editableStyleSlice";

// Controlled hex text input with Copy + Paste buttons
function HexInput({ value, onChange }) {
  const [draft, setDraft] = useState(value);
  const [copied, setCopied] = useState(false);
  const [pasteErr, setPasteErr] = useState(false);

  // Keep draft in sync when the color picker wheel changes the value externally
  useEffect(() => { setDraft(value); }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value;
    if (raw && !raw.startsWith("#")) raw = "#" + raw;
    setDraft(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) onChange(raw);
  };

  const handleBlur = () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(draft)) setDraft(value);
  };

  // Copy current hex to clipboard
  const handleCopy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Paste from clipboard and apply if valid hex
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      let raw = text.trim();
      if (raw && !raw.startsWith("#")) raw = "#" + raw;
      if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
        setDraft(raw);
        onChange(raw);
        setPasteErr(false);
      } else {
        setPasteErr(true);
        setTimeout(() => setPasteErr(false), 1500);
      }
    } catch {
      setPasteErr(true);
      setTimeout(() => setPasteErr(false), 1500);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={7}
        spellCheck={false}
        placeholder="#000000"
        className="w-20 text-xs font-mono border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30 text-gray-700 tracking-wider uppercase"
      />
      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy hex"
        className="text-[10px] font-semibold px-1.5 py-1 rounded border border-gray-200 text-gray-500 hover:text-brand hover:border-brand transition-colors"
      >
        {copied ? "✓" : "Copy"}
      </button>
      {/* Paste button */}
      <button
        type="button"
        onClick={handlePaste}
        title="Paste & apply hex"
        className={`text-[10px] font-semibold px-1.5 py-1 rounded border transition-colors ${
          pasteErr
            ? "border-red-300 text-red-500"
            : "border-gray-200 text-gray-500 hover:text-brand hover:border-brand"
        }`}
      >
        {pasteErr ? "Invalid" : "Paste"}
      </button>
    </div>
  );
}

const POPOVER_WIDTH = 300;

export default function ColorEditPopover() { // Force Vite reload
  const dispatch = useDispatch();
  const popover = useSelector(selectPopover);
  
  const popoverKey = popover?.key;
  const override = useSelector(selectStyle(popoverKey));
  const groupCount = useSelector(selectGroupCount(popoverKey));

  const popoverRef = useRef(null);

  useEffect(() => {
    if (!popover) return;
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) dispatch(closePopover());
    };
    const handleKeyDown = (e) => { if (e.key === "Escape") dispatch(closePopover()); };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popover, dispatch]);

  if (!popover) return null;

  const { key, label, hasBackground, hasText = true, anchorRect } = popover;

  // Estimate popover height
  const estimatedPopoverHeight = (hasBackground ? 45 : 0) + (hasText ? 45 : 0) + 145;

  // The sticky navbar takes up ~150px. If there isn't enough room above the
  // clicked element for the full popover (plus a small margin), flip it down.
  const spaceAbove = anchorRect.top - 10;
  const flipDown = spaceAbove < estimatedPopoverHeight + 20;

  // Track final show-below decision (either natural flipDown or hard-floor override)
  let showBelow = flipDown;
  let top = flipDown
    ? anchorRect.bottom + 10          // show below element
    : anchorRect.top - 10;            // anchor point (popover will translateY(-100%) up from here)

  // Hard floor: never let the popover overlap the sticky navbar
  const NAVBAR_HEIGHT = 155;
  if (!flipDown && top - estimatedPopoverHeight < NAVBAR_HEIGHT) {
    // Not enough room above — force below instead
    top = anchorRect.bottom + 10;
    showBelow = true;
  }

  let left = anchorRect.left + anchorRect.width / 2 - POPOVER_WIDTH / 2;
  if (left < 10) left = 10;
  if (left + POPOVER_WIDTH > window.innerWidth - 10) left = window.innerWidth - POPOVER_WIDTH - 10;

  return (
    <div
      ref={popoverRef}
      className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border-2 border-brand p-4"
      style={{
        top,
        left,
        width: POPOVER_WIDTH,
        transform: showBelow ? "none" : "translateY(-100%)",
      }}
    >
      <button
        onClick={() => dispatch(closePopover())}
        aria-label="Close color editor"
        className="absolute top-2 right-2.5 text-gray-400 hover:text-red-500"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">
        <Paintbrush size={12} /> Change Color
      </div>

      <div className="text-sm font-medium text-gray-800 bg-gray-100 inline-block px-2.5 py-1 rounded-full mb-2">
        {label}
      </div>

      {groupCount > 1 && (
        <div className="flex items-center gap-1 text-[11px] font-semibold text-brand bg-blue-50 rounded-full px-2 py-0.5 mb-2 w-fit">
          <Link2 size={11} /> Synced across {groupCount} elements
        </div>
      )}

      {/* Text color row */}
      {hasText && (
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-gray-600 font-medium w-16 shrink-0">Text</label>
          <input
            type="color"
            value={override.color || "#1f2a44"}
            onChange={(e) => dispatch(setColor({ key, color: e.target.value, hasBackground }))}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full border-2 border-gray-200 cursor-pointer shrink-0"
          />
          <HexInput
            value={override.color || "#1f2a44"}
            onChange={(hex) => dispatch(setColor({ key, color: hex, hasBackground }))}
          />
        </div>
      )}

      {/* Background color row */}
      {hasBackground && (
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-gray-600 font-medium w-16 shrink-0">Background</label>
          <input
            type="color"
            value={override.background || "#ffffff"}
            onChange={(e) => dispatch(setBackground({ key, background: e.target.value }))}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full border-2 border-gray-200 cursor-pointer shrink-0"
          />
          <HexInput
            value={override.background || "#ffffff"}
            onChange={(hex) => dispatch(setBackground({ key, background: hex }))}
          />
        </div>
      )}

      <div className="flex justify-end mt-1">
        <button
          onClick={() => dispatch(resetStyle(key))}
          className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-dark"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}