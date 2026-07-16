import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { MapPin, CreditCard, Banknote, Check, Tag, X, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  applyCoupon,
  clearCart,
  removeCoupon,
  selectAppliedCoupon,
  selectCartItems,
  selectCartLoading,
  selectCartTotals,
} from "../store/cartSlice";
import { selectAvailableCoupons } from "../store/couponSlice";
import { addApiOrder, createOrder } from "../store/ordersSlice";
import { getUserSavedName, selectUser } from "../store/authSlice";
import { fetchReferralStats, selectWalletBalance } from "../store/referralSlice";
import Editable from "../components/editable/Editable";
import {
  CHECKOUT_ADDRESS_WARNING,
  emptyDeliveryAddress as emptyAddress,
  getCheckoutAddressDecision,
  isCompleteAddress,
  normalizeSavedAddress,
  saveDeliveryProfile,
} from "../utils/checkoutAddress";
import { COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../config/api";
import PageLoadingState from "../components/PageLoadingState";
import { showErrorPopup } from "../utils/notificationCenter";
import {
  createRazorpayOrder,
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from "../utils/razorpay";

const PAYMENT_METHODS = [
  {
    id: "razorpay",
    label: "Razorpay Online Payment",
    icon: CreditCard,
    hint: "UPI, cards, netbanking and wallets",
  },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, hint: "Not available on digital items" },
];

const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const getInitialCheckoutAddress = (user, checkoutState = {}) => {
  if (checkoutState?.deliveryAddressMode === "empty") return { ...emptyAddress };

  const routeAddress = normalizeSavedAddress(checkoutState?.deliveryAddress || {});
  if (checkoutState?.deliveryAddressMode === "prefill" && isCompleteAddress(routeAddress)) {
    return { ...emptyAddress, ...routeAddress };
  }

  return { ...emptyAddress, name: getUserSavedName(user) || "" };
};

export default function Checkout() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const cartLoading = useSelector(selectCartLoading);
  const { subtotal: discountedSubtotal, itemSubtotal, itemCount } = useSelector(selectCartTotals);
  const subtotal = itemSubtotal;
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const availableCoupons = useSelector(selectAvailableCoupons) || [];
  const user = useSelector(selectUser);
  const walletBalance = useSelector(selectWalletBalance);
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state;
  const initialAddress = getInitialCheckoutAddress(user, checkoutState);
  const routePrefilled =
    checkoutState?.deliveryAddressMode === "prefill" && isCompleteAddress(initialAddress);
  const routeForcedEmpty = checkoutState?.deliveryAddressMode === "empty";

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(initialAddress);
  const [checkingSavedAddress, setCheckingSavedAddress] = useState(
    Boolean(user && !routeForcedEmpty && !routePrefilled && !isCompleteAddress(initialAddress)),
  );
  const [addressWarning, setAddressWarning] = useState(checkoutState?.addressWarning || "");
  const [addressSaveError, setAddressSaveError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [payment, setPayment] = useState("razorpay");
  const [useWallet, setUseWallet] = useState(false);
  const [placing, setPlacing] = useState(false);
  const checkoutKey = useRef(
    globalThis.crypto?.randomUUID?.() ||
      `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  );

  // ── Coupon state ──
  const [couponInput, setCouponInput] = useState("");
  const [couponResult, setCouponResult] = useState(null); // { valid, message }
  const [showCoupons, setShowCoupons] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (user) {
      dispatch(fetchReferralStats());
    }

    const prefillAddress = async () => {
      if (checkoutState?.deliveryAddressMode === "empty") {
        setAddress({ ...emptyAddress });
        setAddressWarning(checkoutState?.addressWarning || CHECKOUT_ADDRESS_WARNING);
        setCheckingSavedAddress(false);
        return;
      }

      const routeAddress = normalizeSavedAddress(checkoutState?.deliveryAddress || {});
      if (checkoutState?.deliveryAddressMode === "prefill" && isCompleteAddress(routeAddress)) {
        setAddress({ ...emptyAddress, ...routeAddress });
        setAddressWarning("");
        setCheckingSavedAddress(false);
        return;
      }

      if (!user) {
        setCheckingSavedAddress(false);
        return;
      }

      setCheckingSavedAddress(true);
      try {
        const decision = await getCheckoutAddressDecision(user);

        if (!cancelled && decision.isFilled) {
          setAddress({ ...emptyAddress, ...decision.address });
          setAddressWarning("");
        }
      } catch (err) {
        console.error("Could not fetch saved profile for checkout", err);
        showErrorPopup(err, {
          title: "Saved address unavailable",
          details: "You can still enter a delivery address manually.",
        });
      } finally {
        if (!cancelled) setCheckingSavedAddress(false);
      }
    };

    prefillAddress();

    return () => {
      cancelled = true;
    };
  }, [user, checkoutState]);

  useEffect(() => {
    if (appliedCoupon?.couponId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCouponInput(appliedCoupon.couponId);
      setCouponResult({ valid: true, message: "Coupon applied successfully" });
    }
  }, [appliedCoupon?.couponId]);

  if (cartLoading && items.length === 0) {
    return <PageLoadingState label="Preparing checkout..." />;
  }

  if (items.length === 0) {
    return (
      <Editable as="div" kind="button" id="checkout-empty-card" label="Checkout Empty Card"
        className="bg-white rounded-md shadow-card py-16 text-center">
        <Helmet>
          <title>Checkout | AstroMart</title>
          <meta name="description" content="Secure checkout at AstroMart." />
        </Helmet>
        <Editable as="p" id="checkout-empty-text" label="Checkout Empty Text" className="text-gray-600 mb-4">
          Your cart is empty — add something before checking out.
        </Editable>
        <Editable as={Link} to="/" kind="button" id="checkout-continue-btn" label="Continue Shopping Button"
          className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm">
          Continue Shopping
        </Editable>
      </Editable>
    );
  }

  const addressValid = isCompleteAddress(address);

  const couponDiscount = Number(appliedCoupon?.discount) || 0;
  let walletDiscount = 0;
  if (useWallet && walletBalance > 0) {
    walletDiscount = Math.min(walletBalance, Math.max(0, subtotal - couponDiscount));
  }
  
  const finalTotal = Math.max(0, discountedSubtotal - walletDiscount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;

    const result = await dispatch(applyCoupon(couponInput.trim().toUpperCase()));
    if (result.type?.endsWith("/rejected")) {
      setCouponResult({
        valid: false,
        message: result.payload || "Could not apply coupon.",
      });
      return;
    }

    setCouponResult({ valid: true, message: "Coupon applied successfully" });
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponResult(null);
    setCouponInput("");
  };

  const handleDeliverHere = async () => {
    if (!addressValid || savingAddress) return;

    setSavingAddress(true);
    setAddressSaveError("");

    try {
      await saveDeliveryProfile(address);
      setAddressWarning("");
      setStep(2);
    } catch (err) {
      const message = err.message || "Could not save delivery details. Please try again.";
      setAddressSaveError(message);
      showErrorPopup(message, {
        title: "Delivery address was not saved",
        details: "Verify every address field and try again.",
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);

    const invalidItems = items.filter((item) => {
      const productId = item.productId || item._id || item.id;
      return !isMongoObjectId(productId);
    });

    if (invalidItems.length > 0) {
      showErrorPopup(
        "Some cart items were added from old demo data. Remove them and add the products again before placing the order.",
        {
          title: "Cart contains invalid items",
          details: `${invalidItems.length} item(s) do not have a valid product ID.`,
          duration: 0,
        },
      );
      setPlacing(false);
      return;
    }

    const orderPayload = {
      items: items.map((item) => ({
        productId: item.productId || item._id || item.id,
        quantity: item.qty,
      })),
      shippingAddress: {
        fullName: address.name,
        phone: address.phone,
        address: address.line,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      paymentMethod: payment,
      coupon: appliedCoupon?.couponId || null,
      useWallet,
      idempotencyKey: checkoutKey.current,
    };

    try {
      let completedOrder;

      if (payment === "cod") {
        const result = await dispatch(createOrder(orderPayload));
        if (result.type?.endsWith("/rejected")) {
          const error = new Error(result.payload || "Order could not be placed");
          error.apiReported = true;
          throw error;
        }
        completedOrder = result.payload;
      } else {
        const paymentOrder = await createRazorpayOrder(orderPayload);
        const paymentResponse = await openRazorpayCheckout({
          paymentOrder,
          customer: {
            name: address.name,
            email: user?.email,
            phone: address.phone,
          },
          itemCount,
          onPaymentFailed: (paymentError) => {
            showErrorPopup(paymentError.description || "The payment attempt failed.", {
              title: "Razorpay payment failed",
              details: [
                paymentError.reason ? `Reason: ${paymentError.reason}` : "",
                paymentError.code ? `Code: ${paymentError.code}` : "",
                "You can retry in the Razorpay window or close it without placing the order.",
              ]
                .filter(Boolean)
                .join("\n"),
              duration: 0,
            });
          },
        });
        const rawOrder = await verifyRazorpayPayment(paymentResponse);
        dispatch(addApiOrder(rawOrder));
        completedOrder = rawOrder;
      }

      const clearResult = await dispatch(clearCart());
      if (clearResult.type?.endsWith("/rejected")) {
        showErrorPopup(
          "Your order was placed, but the cart could not be synchronized.",
          {
            title: "Order placed; cart refresh needed",
            details: clearResult.payload || "Open the cart again to retry synchronization.",
          },
        );
      }
      navigate(`/order-success/${completedOrder._id || completedOrder.id}`);
    } catch (error) {
      if (error.code === "RAZORPAY_DISMISSED") {
        showErrorPopup("No payment was completed and no order was placed.", {
          title: "Payment cancelled",
          details: "Your cart is unchanged. You can retry whenever you are ready.",
        });
      } else if (!error.apiReported) {
        showErrorPopup(error, {
          title: "Payment could not be completed",
          details: `Payment method: ${payment.toUpperCase()}\nItems: ${items.length}`,
          duration: 0,
        });
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <Helmet>
        <title>Checkout | AstroMart</title>
        <meta name="description" content="Secure checkout at AstroMart." />
      </Helmet>
      {/* ── Left: Steps ── */}
      <div className="flex-1 min-w-0 bg-white rounded-md shadow-card p-4 sm:p-5">

        {/* Step 1: Address */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>
            {step > 1 ? <Check size={13} /> : 1}
          </span>
          <h2 className="font-semibold text-gray-900">Delivery Address</h2>
        </div>

        {step === 1 && checkingSavedAddress ? (
          <div className="pl-8 py-6 text-sm text-gray-500">
            Loading your saved delivery address...
          </div>
        ) : step === 1 ? (
          <div className="pl-0 sm:pl-8 flex flex-col gap-3 max-w-md min-w-0">
            {addressWarning && (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {addressWarning}
              </div>
            )}
            <input placeholder="Full Name" value={address.name}
              onChange={(e) => setAddress({ ...address, name: e.target.value })}
              className="w-full min-w-0 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand" />
            <div>
              <input placeholder="10-digit Mobile Number" value={address.phone} maxLength={10}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setAddress({ ...address, phone: val });
                  if (val.length === 0) {
                    setPhoneError("");
                  } else if (!/^[6-9]/.test(val)) {
                    setPhoneError("❌ Mobile number must start with 6, 7, 8, or 9.");
                  } else if (val.length < 10) {
                    setPhoneError("⚠️ Please enter a complete 10-digit mobile number.");
                  } else {
                    setPhoneError("");
                  }
                }}
                className={`w-full min-w-0 border rounded px-3 py-2 text-sm focus:outline-brand ${
                  phoneError ? "border-red-400 bg-red-50" : "border-gray-300"
                }`} />
              {phoneError && (
                <p className="text-xs text-red-600 mt-1 font-medium pl-1">{phoneError}</p>
              )}
            </div>
            <input placeholder="Address (House No, Street, Area)" value={address.line}
              onChange={(e) => setAddress({ ...address, line: e.target.value })}
              className="w-full min-w-0 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand" />
            <div className="flex flex-col sm:flex-row gap-3 min-w-0">
              <input placeholder="City" value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full min-w-0 border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-brand" />
              <input placeholder="State" value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full min-w-0 border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-brand" />
            </div>
            <input placeholder="Pincode" value={address.pincode} maxLength={6}
              onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-32 focus:outline-brand" />
            {addressSaveError && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {addressSaveError}
              </div>
            )}
            <Editable as="button" kind="button" id="checkout-deliver-btn" label="Deliver Here Button"
              disabled={!addressValid || savingAddress} onClick={handleDeliverHere}
              className="self-start bg-cta-buy text-white text-sm font-semibold px-8 py-2.5 rounded-sm mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {savingAddress ? "Saving..." : "Deliver Here"}
            </Editable>
          </div>
        ) : (
          <div className="pl-8 mb-4 text-sm text-gray-600 flex items-start gap-2">
            <MapPin size={15} className="text-brand mt-0.5" />
            <span>{address.name}, {address.line}, {address.city}, {address.state} - {address.pincode} • {address.phone}</span>
          </div>
        )}

        <hr className="my-5 border-gray-100" />

        {/* Step 2: Payment */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>2</span>
          <h2 className={`font-semibold ${step >= 2 ? "text-gray-900" : "text-gray-400"}`}>Payment Method</h2>
        </div>

        {step === 2 && (
          <div className="pl-0 sm:pl-8 flex flex-col gap-2 max-w-md min-w-0">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <label key={m.id}
                  className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer ${payment === m.id ? "border-brand bg-brand/5" : "border-gray-200"}`}>
                  <input type="radio" name="payment" checked={payment === m.id}
                    onChange={() => setPayment(m.id)} className="accent-brand" />
                  <Icon size={18} className="text-brand" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.hint}</p>
                  </div>
                </label>
              );
            })}

            {/* ── Wallet Balance ── */}
            {walletBalance > 0 && (
              <Editable as="label" kind="button" id="checkout-wallet-toggle" label="Wallet Balance Toggle"
                className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer mt-2 ${useWallet ? "border-gold bg-gold/5" : "border-gray-200"}`}>
                <input type="checkbox" checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)} className="accent-brand" />
                <Wallet size={18} className="text-gold-dark" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Use Wallet Balance</p>
                  <p className="text-xs text-gray-500">Available: ₹{walletBalance}</p>
                </div>
              </Editable>
            )}

            {/* ── Coupon Code ── */}
            <Editable as="div" kind="button" id="checkout-coupon-section" label="Coupon Section Background"
              className="border border-dashed border-brand/40 rounded-md p-3 mt-2 bg-brand/3">
              <button onClick={() => setShowCoupons(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-brand w-full">
                <Tag size={15} />
                <Editable as="span" id="checkout-coupon-label" label="Coupon Section Label">
                  Have a coupon code?
                </Editable>
                {showCoupons ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
              </button>

              {showCoupons && (
                <div className="mt-3">
                  {appliedCoupon ? (
                    <Editable as="div" kind="button" id="checkout-coupon-applied" label="Coupon Applied Badge"
                      className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Check size={15} className="text-green-600" />
                        <div>
                          <Editable as="p" id="checkout-coupon-code-text" label="Applied Coupon Code"
                            className="text-sm font-semibold text-green-700">{appliedCoupon.couponId}</Editable>
                          <Editable as="p" id="checkout-coupon-saving" label="Coupon Saving Text"
                            className="text-xs text-green-600">You save ₹{couponDiscount}</Editable>
                        </div>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-gray-400 hover:text-red-500">
                        <X size={15} />
                      </button>
                    </Editable>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                        className="w-full min-w-0 flex-1 border border-gray-300 rounded px-3 py-2 text-sm uppercase focus:outline-brand font-mono" />
                      <Editable as="button" kind="button" id="checkout-apply-coupon-btn" label="Apply Coupon Button"
                        onClick={handleApplyCoupon}
                        className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded shrink-0">
                        Apply
                      </Editable>
                    </div>
                  )}

                  {couponResult && !couponResult.valid && (
                    <p className="text-xs text-red-500 mt-1">{couponResult.message}</p>
                  )}
                  
                  {/* Available Coupons List */}
                  {!appliedCoupon && availableCoupons.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-brand/20">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Available Coupons</p>
                      <div className="flex flex-col gap-2">
                        {availableCoupons.map(coupon => (
                          <div key={coupon.couponId} className="flex items-center justify-between bg-white border border-brand/30 rounded p-2">
                            <div>
                              <p className="text-sm font-bold text-brand">{coupon.couponId}</p>
                              <p className="text-xs text-gray-600">
                                {coupon.discountType === 'fixed' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}
                                {coupon.minPurchaseAmount > 0 && ` on orders above ₹${coupon.minPurchaseAmount}`}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setCouponInput(coupon.couponId);
                                dispatch(applyCoupon(coupon.couponId)).then((result) => {
                                  if (result.type?.endsWith("/rejected")) {
                                    setCouponResult({ valid: false, message: result.payload });
                                  } else {
                                    setCouponResult({ valid: true, message: "Coupon applied successfully" });
                                  }
                                });
                              }}
                              className="text-xs font-semibold text-white bg-brand px-3 py-1.5 rounded hover:bg-brand/90 transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Editable>

            <Editable as="button" kind="button" id="checkout-place-order-btn" label="Place Order Button"
              onClick={handlePlaceOrder} disabled={placing}
              className="self-start bg-cta-buy text-white text-sm font-semibold px-8 py-2.5 rounded-sm mt-3 disabled:opacity-60">
              {placing
                ? payment === "cod" ? "Placing Order..." : "Opening Razorpay..."
                : `${payment === "cod" ? "Place Order" : "Pay Securely"} — ₹${finalTotal.toLocaleString("en-IN")}`}
            </Editable>
          </div>
        )}
      </div>

      {/* ── Right: Order Summary ── */}
      <Editable as="div" kind="button" id="checkout-summary-card" label="Order Summary Card Background"
        className="w-full md:w-80 shrink-0 bg-white rounded-md shadow-card p-4 h-fit">
        <Editable as="h3" id="checkout-summary-heading" label="Order Summary Heading"
          className="text-xs font-semibold text-gray-500 uppercase mb-3">
          Order Summary ({itemCount} {itemCount === 1 ? "item" : "items"})
        </Editable>
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto mb-3">
          {items.map((i) => (
            <div key={i.id} className="flex gap-2 text-sm">
              <img loading="lazy" src={toAssetUrl(i.image, COMMON_CLOUDINARY_IMAGE_URL)} className="w-10 h-10 rounded object-cover" alt=""
                onError={e => { e.target.onerror = null; e.target.src = COMMON_CLOUDINARY_IMAGE_URL; }} />
              <div className="flex-1">
                <p className="line-clamp-1 text-gray-700">{i.name}</p>
                {i.selectedVariants && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {Object.entries(i.selectedVariants).map(([key, val]) => (
                      <span key={key} className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded-sm">{key}: {val}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">Qty: {i.qty}</p>
              </div>
              <span className="text-gray-800 font-medium">₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-200 pt-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <Editable as="span" id="checkout-summary-coupon-label" label="Summary Coupon Label"
                className="text-green-600">Coupon ({appliedCoupon?.couponId})</Editable>
              <Editable as="span" id="checkout-summary-coupon-value" label="Summary Coupon Value"
                className="text-green-600 font-medium">- ₹{couponDiscount}</Editable>
            </div>
          )}
          {walletDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <Editable as="span" id="checkout-summary-wallet-label" label="Summary Wallet Label"
                className="text-green-600">Wallet Discount</Editable>
              <Editable as="span" id="checkout-summary-wallet-value" label="Summary Wallet Value"
                className="text-green-600 font-medium">- ₹{walletDiscount}</Editable>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 text-base pt-1 border-t border-gray-100">
            <Editable as="span" id="checkout-total-label" label="Total Label">Total</Editable>
            <Editable as="span" id="checkout-total-value" label="Total Amount">₹{finalTotal.toLocaleString("en-IN")}</Editable>
          </div>
        </div>
      </Editable>
    </div>
  );
}
