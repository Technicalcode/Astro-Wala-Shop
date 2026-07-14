import { useEffect, createContext, useContext } from "react";
import { selectUser } from "../../store/authSlice";
import { useSelector, useDispatch } from "react-redux";
import { selectEditMode, selectStyle, registerKey, unregisterKey, openPopover } from "../../store/editableStyleSlice";
import { getContrastingColor } from "../../utils/colorUtils";

export const CurrentBgContext = createContext(null);

/**
 * <Editable>
 * -----------
 * Drop-in wrapper that turns any piece of text or any button into an
 * "admin-recolorable" element — the React/hooks equivalent of adding
 * `class="editable" data-id="..." data-group="..."` to a DOM node in the
 * original HTML.
 *
 * Props
 *  - as            : tag/element to render (default "span"). Use "button" to
 *                    recolor a real <button>.
 *  - id            : unique key. Required if `group` is not given.
 *  - group         : shared key. Give the same `group` to several <Editable>
 *                    elements and changing the color of ONE changes ALL of
 *                    them (and persists for elements that aren't even
 *                    mounted right now) — this is the hooks-based replacement
 *                    for the original "group sync" feature.
 *  - kind          : "text" (default, text color only) | "button" (text +
 *                    background color). NOT to be confused with the native
 *                    HTML `type` attribute, which is passed straight through
 *                    via `...rest` so `<Editable as="button" type="submit">`
 *                    still works correctly.
 *  - label         : friendly name shown in the color popover.
 *
 * Behaviour
 *  - When edit mode is OFF (default) or the visitor isn't a logged-in admin,
 *    this component is a transparent pass-through: same tag, same classes,
 *    same onClick — current functionality is untouched.
 *  - When edit mode is ON *and* the user is an admin, normal clicks are
 *    suppressed (so admins can safely double-click a <Link>/<button> without
 *    triggering navigation or firing the action twice) and a double-click
 *    opens the shared <ColorEditPopover>.
 */
export default function Editable({
  as: Tag = "span",
  id,
  group,
  kind = "text",
  label,
  isolate = false,
  className = "",
  style = {},
  children,
  onClick,
  onDoubleClick,
  ...rest
}) {
  const user = useSelector(selectUser);
  const isAdmin = user?.role === "admin";
  const dispatch = useDispatch();
  const editMode = useSelector(selectEditMode);
  
  const storageKey = group || id;
  const override = useSelector(selectStyle(storageKey));
  const parentBg = useContext(CurrentBgContext);

  if (!storageKey && import.meta.env?.DEV) {
    console.warn("<Editable> requires either an `id` or a `group` prop.");
  }

  // Track how many instances of this key are currently on screen, purely so
  // the popover can show a "synced across N elements" badge.
  useEffect(() => {
    if (!storageKey) return;
    dispatch(registerKey(storageKey));
    return () => dispatch(unregisterKey(storageKey));
  }, [storageKey, dispatch]);

  let activeColor = override.color;
  let activeBg = override.background;

  const effectiveBg = activeBg || (isolate ? null : parentBg);

  if (!activeColor && effectiveBg) {
    activeColor = getContrastingColor(effectiveBg);
  }

  const mergedStyle = {
    ...style,
    ...(activeColor ? { color: activeColor } : {}),
    ...(activeBg ? { backgroundColor: activeBg } : {}),
  };

  const active = isAdmin && editMode;

  const handleClick = (e) => {
    if (active) {
      // Don't let a double-click-in-progress also trigger navigation / submit / add-to-cart etc.
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  const handleDoubleClick = (e) => {
    if (!active) {
      onDoubleClick?.(e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dispatch(openPopover({
      key: storageKey,
      label: label || storageKey,
      hasBackground: kind === "button",
      hasText: kind === "button" || kind === "text",
      anchorRect: e.currentTarget.getBoundingClientRect(),
    }));
  };

  const content = (
    <Tag
      {...rest}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={mergedStyle}
      className={
        className +
        (active
          ? " outline outline-1 outline-dashed outline-brand/70 outline-offset-2 cursor-pointer"
          : "")
      }
      title={active ? "Double-click to change color" : rest.title}
    >
      {children}
    </Tag>
  );

  if (effectiveBg) {
    return (
      <CurrentBgContext.Provider value={effectiveBg}>
        {content}
      </CurrentBgContext.Provider>
    );
  }

  return content;
}
