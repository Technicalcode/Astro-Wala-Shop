import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import Editable from "./editable/Editable";
import { useSelector, useDispatch } from "react-redux";
import { selectWishlistIds, toggleWishlist } from "../store/wishlistSlice";
import { selectUser } from "../store/authSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { showErrorPopup } from "../utils/notificationCenter";

export default function WishlistButton({ product, className = "", groupId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  
  const wishlistIds = useSelector(selectWishlistIds);
  const productId = String(product.productId || product._id || product.id || "");
  const wishlisted = wishlistIds.includes(productId);
  const [saving, setSaving] = useState(false);
  const [showSavedAnimation, setShowSavedAnimation] = useState(false);
  const animationTimer = useRef(null);

  useEffect(() => () => clearTimeout(animationTimer.current), []);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (saving) return;
    const wasWishlisted = wishlisted;
    setSaving(true);

    try {
      const result = await dispatch(toggleWishlist(product));
      if (result.type?.endsWith("/rejected")) {
        showErrorPopup(result.payload || "Could not update wishlist.", {
          title: "Wishlist update failed",
          details: `Product: ${product.name}`,
        });
        return;
      }

      if (!wasWishlisted) {
        setShowSavedAnimation(true);
        clearTimeout(animationTimer.current);
        animationTimer.current = setTimeout(() => setShowSavedAnimation(false), 900);
      }
    } finally {
      setSaving(false);
    }
  };

  const btnGroup = groupId ? `wishlist-btn-${groupId}` : "wishlist-btn";

  return (
    <Editable
      as="button"
      kind="button"
      group={btnGroup}
      label="Wishlist Heart Button"
      isolate
      onClick={handleClick}
      disabled={saving}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`relative h-8 w-8 rounded-full shadow flex items-center justify-center transition-all disabled:cursor-wait ${
        wishlisted 
          ? "bg-brand text-white" 
          : "bg-white/90 text-gray-400 hover:text-brand"
      } ${className}`}
    >
      {showSavedAnimation && (
        <>
          <span className="absolute inset-0 rounded-full bg-brand/35 animate-ping" />
          <span className="absolute right-0 top-9 rounded bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg animate-[fadeInUp_0.2s_ease-out] whitespace-nowrap">
            Saved
          </span>
        </>
      )}
      <Heart 
        size={16} 
        fill={wishlisted ? "currentColor" : "none"} 
        strokeWidth={wishlisted ? 0 : 2} 
        className={`relative z-10 transition-transform ${showSavedAnimation ? "scale-125" : "scale-100"}`}
      />
    </Editable>
  );
}
