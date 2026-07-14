import { useEffect, useState } from "react";
import { ShoppingCart, Zap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/cartSlice";
import { selectUser } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import Editable from "./editable/Editable";
import { getCheckoutNavigationState } from "../utils/checkoutAddress";
import { showErrorPopup } from "../utils/notificationCenter";

/**
 * Sticky bottom cart bar — appears when the main CTA buttons scroll out of view.
 * Usage: pass a `sentinelRef` that is attached to a div just below the main buttons.
 */
export default function StickyCartBar({ product, sentinelRef }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const [checkingCheckout, setCheckingCheckout] = useState(false);

  useEffect(() => {
    if (!sentinelRef?.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef]);

  if (!product) return null;

  const currentStock = product.stock !== undefined ? product.stock : 25;
  const isOutOfStock = currentStock === 0;

  const handleAdd = async () => {
    if (!user) { navigate("/login"); return; }
    const result = await dispatch(addToCart(product));
    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Could not add product to cart.", {
        title: "Could not add item",
        details: `Product: ${product.name}`,
      });
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuy = async () => {
    if (!user) { navigate("/login"); return; }
    if (checkingCheckout) return;

    setCheckingCheckout(true);
    try {
      const checkoutState = await getCheckoutNavigationState(user);
      const result = await dispatch(
        addToCart({ product, skipCartDrawer: true }),
      );
      if (result.type?.endsWith("/rejected")) {
        showErrorPopup(result.payload || "Could not add product to cart.", {
          title: "Could not start checkout",
          details: `Product: ${product.name}`,
        });
        return;
      }
      navigate("/checkout", { state: checkoutState });
    } finally {
      setCheckingCheckout(false);
    }
  };

  return (
    <Editable
      as="div"
      kind="button"
      id="sticky-cart-bar"
      label="Sticky Cart Bar Background"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <img loading="lazy"
          src={product.images?.[0] || product.image}
          alt={product.name}
          className="w-10 h-10 rounded object-cover shrink-0"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40?text=?"; }}
        />
        <div className="flex-1 min-w-0">
          <Editable as="p" id="sticky-cart-bar-name" label="Sticky Bar Product Name"
            className="text-sm font-medium text-gray-900 truncate">
            {product.name}
          </Editable>
          <Editable as="p" id="sticky-cart-bar-price" label="Sticky Bar Price"
            className="text-sm font-semibold text-brand">
            ₹{product.price?.toLocaleString("en-IN")}
          </Editable>
        </div>
        <div className="flex gap-2 shrink-0">
          <Editable
            as="button"
            kind="button"
            id="sticky-add-cart-btn"
            label="Sticky Add to Cart Button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-sm transition-colors ${isOutOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-cta-cart text-gray-900'}`}
          >
            <ShoppingCart size={15} />
            {isOutOfStock ? "Out of Stock" : (added ? "Added!" : "Add to Cart")}
          </Editable>
          <Editable
            as="button"
            kind="button"
            id="sticky-buy-btn"
            label="Sticky Buy Now Button"
            onClick={handleBuy}
            disabled={isOutOfStock || checkingCheckout}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-sm transition-colors ${isOutOfStock || checkingCheckout ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-cta-buy text-white'}`}
          >
            <Zap size={15} />
            {isOutOfStock ? "Out of Stock" : checkingCheckout ? "Checking..." : "Buy Now"}
          </Editable>
        </div>
      </div>
    </Editable>
  );
}
