import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ChevronDown,
  Store,
  User,
  Menu,
  X,
  Gift,
  Heart,
} from "lucide-react";
import { selectCartTotals } from "../store/cartSlice";
import { selectUser, logout, getUserFirstName } from "../store/authSlice";
import { selectCategories } from "../store/categoriesSlice";
import { useSelector, useDispatch } from "react-redux";
import FestivalLogo from "./FestivalLogo";
import FestivalStrip from "./FestivalStrip";
import SmartSearchBar from "./SmartSearchBar";
import Editable from "./editable/Editable";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { itemCount } = useSelector(selectCartTotals);
  const user = useSelector(selectUser);
  const userDisplayName = user ? getUserFirstName(user) : "";
  const categories = useSelector(selectCategories);
  const dispatch = useDispatch();
    const wishlistIds = useSelector((state) => state.wishlist.wishlistIds);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);


  const availableCoupons = useSelector((state) => state.coupon?.availableCoupons) || [];
  const displayCoupon = availableCoupons.find(c => c.isActive !== false);
  const couponText = displayCoupon 
    ? (displayCoupon.discountType === 'percentage' ? `${displayCoupon.discountValue}% OFF` : `₹${displayCoupon.discountValue} OFF`) 
    : "";

  return (
    <header className="sticky top-0 z-50">
      <FestivalStrip />
      
      {/* Referral Top Banner */}
      {displayCoupon && !user && (
        <div className="bg-gradient-to-r from-emerald-600 to-green-500 text-white text-center py-1.5 px-3 text-[11px] sm:text-xs font-medium tracking-wide shadow-sm flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span>🎉 Sign up today and get <strong>{couponText}</strong> on your first purchase!</span>
          <Link to="/login" className="underline font-bold hover:text-emerald-100 whitespace-nowrap">Shop Now</Link>
        </div>
      )}

      <Editable
        as="div"
        kind="button"
        id="navbar-header-bg"
        label="Navbar Header Background"
        className="bg-brand relative z-50"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-6">
          <FestivalLogo />

          <div className="flex items-center gap-3 md:gap-6 order-2 md:order-3 ml-auto shrink-0">
            <div className="relative hidden md:block" ref={menuRef}>
              {user ? (
                /* ── User dropdown trigger (logged-in state) ── */
                <Editable
                  as="button"
                  kind="button"
                  id="navbar-user-btn"
                  label="User Dropdown Button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1 text-white text-sm font-medium px-2 py-1.5 rounded hover:bg-white/10"
                >
                  <User size={16} />
                  {userDisplayName}
                  <ChevronDown size={14} />
                </Editable>
              ) : (
                /* ── Login button (logged-out state) ── */
                <Editable
                  as={Link}
                  to="/login"
                  kind="button"
                  id="navbar-login-btn"
                  isolate
                  label="Login Button"
                  className="text-black bg-white text-sm font-semibold px-6 py-1.5 rounded-sm hover:bg-gray-50"
                >
                  Login
                </Editable>
              )}

              {menuOpen && user && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded shadow-xl border border-gray-100 py-1 text-sm z-50">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                    >
                      <Store size={14} /> Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                  >
                    <User size={14} /> My Account
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                  >
                    <Heart size={14} /> My Wishlist
                    {wishlistIds.length > 0 && (
                      <span className="ml-auto bg-brand text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{wishlistIds.length}</span>
                    )}
                  </Link>
                  <Link
                    to="/refer-and-earn"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                  >
                    <Gift size={14} /> Refer &amp; Earn
                  </Link>
                  <button
                    onClick={() => {
                      dispatch(logout());
                      setMenuOpen(false);
                      navigate("/");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* ── Wishlist link ── */}
            <Editable
              as={Link}
              to="/wishlist"
              kind="button"
              id="navbar-wishlist-btn"
              label="Wishlist Button"
              className="relative flex items-center gap-1 text-white text-sm font-medium hidden sm:flex"
            >
              <Heart size={19} />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Editable>

            {/* ── Cart link — fully wrapped so icon + text + bg all editable ── */}
            <Editable
              as={Link}
              to="/cart"
              kind="button"
              id="navbar-cart-btn"
              label="Cart Button (Text + Background)"
              className="relative flex items-center gap-1.5 text-white text-sm font-medium"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-gold text-brand-dark text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Editable>

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden text-white p-1"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* ── Smart Search Bar ── */}
          <div className="order-3 md:order-2 basis-full md:basis-0 md:flex-1 md:max-w-2xl">
            <SmartSearchBar />
          </div>
        </div>

        {mobileMenuOpen && (
          <Editable
            as="div"
            kind="button"
            id="navbar-mobile-menu-bg"
            label="Mobile Menu Background"
            className="md:hidden bg-brand-dark px-4 py-3 flex flex-col gap-1 text-sm"
          >
            {user ? (
              <>
                <Editable as="span" id="navbar-mobile-greeting" label="Mobile Menu Greeting" className="text-white/70 px-1 py-1.5">
                  Hi, {userDisplayName}
                </Editable>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white flex items-center gap-2 px-1 py-2"
                  >
                    <Store size={15} /> Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white flex items-center gap-2 px-1 py-2"
                >
                  <User size={15} /> My Account
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white flex items-center gap-2 px-1 py-2"
                >
                  <Heart size={15} /> My Wishlist
                  {wishlistIds.length > 0 && <span className="text-xs bg-red-500 text-white rounded-full px-1.5">{wishlistIds.length}</span>}
                </Link>
                <Link
                  to="/refer-and-earn"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white flex items-center gap-2 px-1 py-2"
                >
                  <Gift size={15} /> Refer &amp; Earn
                </Link>
                <button
                  onClick={() => {
                    dispatch(logout());
                    setMobileMenuOpen(false);
                    navigate("/");
                  }}
                  className="text-left text-white px-1 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-white px-1 py-2">
                Login
              </Link>
            )}
          </Editable>
        )}
      </Editable>

      <Editable
        as="nav"
        kind="button"
        id="navbar-nav-bar"
        label="Navbar Category Bar Background"
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-4 sm:gap-7 overflow-x-auto no-scrollbar py-2 text-[13px] font-medium text-gray-700">
          <Editable as={Link} to="/" group="nav-link" kind="button" label="Category Link" className="relative whitespace-nowrap hover:text-gold-dark transition-colors flex items-center gap-1 shrink-0 px-2 py-1 rounded after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-gold after:transition-all after:duration-300 hover:after:w-full">
            🏠 Home
          </Editable>
          {categories.filter(c => c.id !== "consultation").map((c) => (
            <Editable
              as={Link}
              key={c.id}
              to={`/category/${c.id}`}
              group="nav-link"
              kind="button"
              label="Category Link"
              className="relative whitespace-nowrap hover:text-gold-dark transition-colors px-2 py-1 rounded after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
            >
              {c.name}
            </Editable>
          ))}
        </div>
      </Editable>
    </header>
  );
}
