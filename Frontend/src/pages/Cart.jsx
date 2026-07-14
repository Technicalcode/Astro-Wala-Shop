import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectCartItems, selectCartTotals, updateQty, removeFromCart, applyCoupon, removeCoupon, selectAppliedCoupon, selectCartLoading, fetchCart } from "../store/cartSlice";
import { selectUser } from "../store/authSlice";
import Editable from "../components/editable/Editable";
import { getCheckoutNavigationState } from "../utils/checkoutAddress";
import { COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../config/api";
import PageLoadingState from "../components/PageLoadingState";
import { showErrorPopup } from "../utils/notificationCenter";

export default function Cart() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const cartLoading = useSelector(selectCartLoading);
  const { subtotal, mrpTotal, totalSavings, couponDiscount, itemCount } = useSelector(selectCartTotals);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const user = useSelector(selectUser);
  const [couponCode, setCouponCode] = useState("");
  const [checkingCheckout, setCheckingCheckout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [dispatch, user]);

  const handleApplyCoupon = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    if (couponCode.trim().length <= 3) {
      showErrorPopup("Coupon codes must contain at least four characters.", {
        title: "Invalid coupon code",
        details: "Check the code and try again.",
      });
      return;
    }

    const result = await dispatch(applyCoupon(couponCode.trim().toUpperCase()));
    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Could not apply coupon.", {
        title: "Coupon could not be applied",
        details: `Code entered: ${couponCode.trim().toUpperCase()}`,
      });
    } else {
      setCouponCode("");
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    if (checkingCheckout) return;

    setCheckingCheckout(true);
    try {
      const checkoutState = await getCheckoutNavigationState(user);
      navigate("/checkout", { state: checkoutState });
    } finally {
      setCheckingCheckout(false);
    }
  };

  if (cartLoading && items.length === 0) {
    return <PageLoadingState label="Loading your cart..." />;
  }

  if (items.length === 0) {
    return (
      <Editable
        as="div"
        kind="button"
        id="cart-empty-card"
        label="Empty Cart Card Background"
        className="bg-white rounded-md shadow-card py-16 flex flex-col items-center gap-4"
      >
        <Helmet>
          <title>Shopping Cart | AstroMart</title>
          <meta name="description" content="View items in your shopping cart at AstroMart." />
        </Helmet>
        <ShoppingBag size={48} className="text-gray-300" />
        <Editable as="p" id="cart-empty-text" label="Empty Cart Message" className="text-gray-600 font-medium">
          Your cart is empty
        </Editable>
        <Editable
          as={Link}
          to="/"
          kind="button"
          id="cart-continue-btn"
          label="Continue Shopping Button"
          className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm hover:bg-brand-dark"
        >
          Continue Shopping
        </Editable>
      </Editable>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <Helmet>
        <title>Shopping Cart | AstroMart</title>
        <meta name="description" content="View items in your shopping cart at AstroMart." />
      </Helmet>
      {/* ── Left: Cart Items ── */}
      <Editable
        as="div"
        kind="button"
        id="cart-main-card"
        label="Cart Main Card Background"
        className="flex-1 bg-white rounded-md shadow-card"
      >
        <div className="p-4 border-b border-gray-100">
          <Editable
            as="h1"
            id="cart-heading"
            label="Cart Page Heading"
            className="font-display font-semibold text-lg text-gray-900"
          >
            My Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </Editable>
        </div>

        {items.map((item) => {
          const lineDiscount = item.mrp ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
          return (
            <div key={item.id} className="p-4 border-b border-gray-100 flex gap-4">
              <Link to={`/product/${item.productId || item.id}`} className="shrink-0">
                <img loading="lazy"
                  src={toAssetUrl(item.image, COMMON_CLOUDINARY_IMAGE_URL)}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = COMMON_CLOUDINARY_IMAGE_URL;
                  }}
                />
              </Link>
              <div className="flex-1">
                <Editable
                  as={Link}
                  to={`/product/${item.productId || item.id}`}
                  group="cart-item-name"
                  label="Cart Item Name"
                  className="text-sm text-gray-800 hover:text-brand line-clamp-2"
                >
                  {item.name}
                </Editable>
                
                {item.selectedVariants && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Object.entries(item.selectedVariants).map(([key, val]) => (
                      <Editable as="span" key={key} group="cart-item-variant" label="Cart Item Variant" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-sm">
                        {key}: {val}
                      </Editable>
                    ))}
                  </div>
                )}
                <Editable
                  as="p"
                  group="cart-item-brand"
                  label="Cart Item Brand"
                  className="text-xs text-gray-500 mt-1"
                >
                  {item.brand}
                </Editable>

                <div className="flex items-center gap-3 mt-3">
                  <Editable
                    as="div"
                    kind="button"
                    id="cart-qty-control"
                    label="Quantity Control Background"
                    className="flex items-center border border-gray-300 rounded"
                  >
                    <button
                      onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty - 1 }))}
                      className="p-1.5 hover:bg-gray-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="px-3 text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty + 1 }))}
                      className="p-1.5 hover:bg-gray-50"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </Editable>
                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="text-gray-400 hover:text-maroon flex items-center gap-1 text-xs"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <Editable
                  as="p"
                  group="cart-item-price"
                  label="Cart Item Price"
                  className="font-semibold text-gray-900"
                >
                  ₹{(item.price * item.qty).toLocaleString("en-IN")}
                </Editable>
                {item.mrp > item.price && (
                  <>
                    <p className="text-xs text-gray-400 line-through">
                      ₹{(item.mrp * item.qty).toLocaleString("en-IN")}
                    </p>
                    <Editable
                      as="p"
                      group="cart-item-discount"
                      label="Cart Item Discount %"
                      className="text-xs text-green-700"
                    >
                      {lineDiscount}% off
                    </Editable>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div className="p-4">
          <Editable
            as="button"
            kind="button"
            id="cart-place-order-btn"
            label="Place Order Button"
            onClick={handleCheckout}
            disabled={checkingCheckout}
            className="bg-cta-buy text-white font-semibold py-3 px-10 rounded-sm uppercase text-sm tracking-wide hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {checkingCheckout ? "Checking..." : "Place Order"}
          </Editable>
        </div>
      </Editable>

      {/* ── Right: Price Summary ── */}
      <Editable
        as="div"
        kind="button"
        id="cart-summary-card"
        label="Price Summary Card Background"
        className="w-full md:w-80 shrink-0 bg-white rounded-md shadow-card p-4 h-fit"
      >
        <Editable
          as="h3"
          id="cart-summary-heading"
          label="Price Details Heading"
          className="text-xs font-semibold text-gray-500 uppercase mb-3"
        >
          Price Details
        </Editable>

        {/* ── Coupon Code Section ── */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          {!appliedCoupon ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-brand uppercase"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-md p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                  <Tag size={14} /> '{appliedCoupon.couponId}' applied!
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Saved Rs {Number(appliedCoupon.discount || 0).toLocaleString("en-IN")}
                  {appliedCoupon.productName ? ` on ${appliedCoupon.productName}` : ""}
                </p>
              </div>
              <button onClick={() => dispatch(removeCoupon())} className="text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <Editable as="span" id="cart-price-label" label="Price Label" className="text-gray-700">
            Price ({itemCount} {itemCount === 1 ? "item" : "items"})
          </Editable>
          <Editable as="span" id="cart-mrp-value" label="MRP Total Value" className="text-gray-700">
            ₹{mrpTotal.toLocaleString("en-IN")}
          </Editable>
        </div>

        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <Editable as="span" id="cart-discount-label" label="Discount Label" className="text-gray-700">
            Discount
          </Editable>
          <Editable as="span" id="cart-discount-value" label="Discount Value" className="text-green-700">
            - ₹{(totalSavings - (couponDiscount || 0)).toLocaleString("en-IN")}
          </Editable>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span className="text-gray-700">Coupon Discount</span>
            <span className="text-green-700">- ₹{couponDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-gray-700 mb-3 pb-3 border-b border-dashed border-gray-200">
          <Editable as="span" id="cart-delivery-label" label="Delivery Label" className="text-gray-700">
            Delivery Charges
          </Editable>
          <Editable as="span" id="cart-delivery-value" label="Delivery Value (Free)" className="text-green-700">
            Free
          </Editable>
        </div>

        <div className="flex justify-between font-semibold text-gray-900 text-base">
          <Editable as="span" id="cart-total-label" label="Total Amount Label" className="text-gray-900 font-semibold">
            Total Amount
          </Editable>
          <Editable as="span" id="cart-total-value" label="Total Amount Value" className="text-gray-900 font-semibold">
            ₹{subtotal.toLocaleString("en-IN")}
          </Editable>
        </div>

        {totalSavings > 0 && (
          <Editable
            as="p"
            id="cart-savings-msg"
            label="Savings Message"
            className="text-green-700 text-xs font-medium mt-3"
          >
            You will save ₹{totalSavings.toLocaleString("en-IN")} on this order
          </Editable>
        )}
      </Editable>
    </div>
  );
}
