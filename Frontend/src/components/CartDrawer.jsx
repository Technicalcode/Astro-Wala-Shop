import { useEffect } from "react";
import { CheckCircle2, ShoppingBag, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCartItems, selectCartTotals } from "../store/cartSlice";
import {
  closeCartDrawer,
  selectCartDrawerOpen,
  selectLastAddedProductId,
} from "../store/cartUiSlice";
import { COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../config/api";

export default function CartDrawer() {
  const dispatch = useDispatch();
  const location = useLocation();
  const open = useSelector(selectCartDrawerOpen);
  const lastAddedProductId = useSelector(selectLastAddedProductId);
  const items = useSelector(selectCartItems);
  const { itemSubtotal, itemCount } = useSelector(selectCartTotals);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") dispatch(closeCartDrawer());
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, open]);

  useEffect(() => {
    dispatch(closeCartDrawer());
  }, [dispatch, location.pathname]);

  return (
    <div
      className={`fixed inset-0 z-[90] transition-[visibility] duration-300 ${
        open ? "visible" : "invisible"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={() => dispatch(closeCartDrawer())}
        className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart drawer"
        tabIndex={open ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[390px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-[calc(100%+1px)]"
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={18} />
              <p className="text-sm font-semibold">Added to cart</p>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeCartDrawer())}
            className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close cart"
          >
            <X size={19} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag size={40} className="text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-700">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const itemProductId = String(item.productId || item._id || item.id || "");
                const highlighted = itemProductId === lastAddedProductId;

                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 rounded-md border p-3 transition-colors ${
                      highlighted ? "border-green-200 bg-green-50" : "border-gray-100"
                    }`}
                  >
                    <img loading="lazy"
                      src={toAssetUrl(item.image, COMMON_CLOUDINARY_IMAGE_URL)}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = COMMON_CLOUDINARY_IMAGE_URL;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-gray-800">{item.name}</p>
                      {item.selectedVariants && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {Object.entries(item.selectedVariants)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" | ")}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">Qty: {item.qty}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          Rs {(item.price * item.qty).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-gray-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Cart subtotal</span>
              <span className="text-lg font-semibold text-gray-900">
                Rs {itemSubtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/cart"
                onClick={() => dispatch(closeCartDrawer())}
                className="rounded border border-brand px-3 py-2.5 text-center text-sm font-semibold text-brand hover:bg-brand/5"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={() => dispatch(closeCartDrawer())}
                className="rounded bg-cta-buy px-3 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
              >
                Checkout
              </Link>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
