import { useEffect, lazy, Suspense, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectBgColor, fetchThemeSettings } from "./store/themeSlice";
import { selectUser, syncUserProfile } from "./store/authSlice";
import { refreshFestivals } from "./store/festivalSlice";
import { fetchCategories } from "./store/categoriesSlice";
import { fetchProducts } from "./store/productsSlice";
import { fetchCart } from "./store/cartSlice";
import { selectCartDrawerOpen } from "./store/cartUiSlice";
import { fetchWishlist } from "./store/wishlistSlice";
import { fetchAvailableCoupons } from "./store/couponSlice";
import { fetchEditableStyles } from "./store/editableStyleSlice";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalLoadingBar from "./components/GlobalLoadingBar";
import PageTracker from "./components/PageTracker";
import PageLoadingState from "./components/PageLoadingState";

const CartDrawer = lazy(() => import("./components/CartDrawer"));
const CompareBar = lazy(() => import("./components/CompareBar"));

const Home = lazy(() => import("./pages/Home"));
const AllCategories = lazy(() => import("./pages/AllCategories"));
const AllProducts = lazy(() => import("./pages/AllProducts"));
const ProductListing = lazy(() => import("./pages/ProductListing"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const AccountDashboard = lazy(() => import("./pages/account/AccountDashboard"));
const AccountProfile = lazy(() => import("./pages/account/AccountProfile"));
const AccountAddresses = lazy(() => import("./pages/account/AccountAddresses"));
const OrderDetail = lazy(() => import("./pages/account/OrderDetail"));
const AccountReturns = lazy(() => import("./pages/account/AccountReturns"));
const ReturnDetail = lazy(() => import("./pages/account/ReturnDetail"));
const AccountReviews = lazy(() => import("./pages/account/AccountReviews"));
const SellerLogin = lazy(() => import("./pages/SellerLogin"));
const AstrologerListing = lazy(() => import("./pages/AstrologerListing"));
const AstrologerDetail = lazy(() => import("./pages/AstrologerDetail"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Contact = lazy(() => import("./pages/Contact"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Referral = lazy(() => import("./pages/Referral"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Compare = lazy(() => import("./pages/Compare"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMostViewed = lazy(() => import("./pages/admin/AdminMostViewed"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminPolicies = lazy(() => import("./pages/admin/AdminPolicies"));
const AdminFooter = lazy(() => import("./pages/admin/AdminFooter"));
const AdminLoginActivity = lazy(() => import("./pages/admin/AdminLoginActivity"));
const AdminHomepage = lazy(() => import("./pages/admin/AdminHomepage"));
const AdminTheme = lazy(() => import("./pages/admin/AdminTheme"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));

export default function App() {
  const dispatch = useDispatch();
  const bgColor = useSelector(selectBgColor);
  const user = useSelector(selectUser);
  const cartDrawerOpen = useSelector(selectCartDrawerOpen);
  const compareCount = useSelector((state) => state.compare.compareList.length);
  const [cartDrawerLoaded, setCartDrawerLoaded] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--site-bg", bgColor);
  }, [bgColor]);

  useEffect(() => {
    [
      "astromart_added_products",
      "astromart_deleted_ids",
      "astromart_edited_products",
      "astromart_added_categories",
      "astromart_deleted_category_ids",
      "astromart_edited_categories",
    ].forEach((key) => localStorage.removeItem(key));

    dispatch(fetchCategories());
    dispatch(fetchProducts());
    dispatch(fetchThemeSettings());
    dispatch(fetchEditableStyles());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      dispatch(fetchAvailableCoupons());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user?.id) dispatch(syncUserProfile());
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (cartDrawerOpen) setCartDrawerLoaded(true);
  }, [cartDrawerOpen]);

  useEffect(() => {
    const today = new Date();
    const msUntilMidnight =
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime() -
      today.getTime();
    const timer = setTimeout(() => {
      dispatch(refreshFestivals());
    }, msUntilMidnight + 1000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <PageTracker />
      <GlobalLoadingBar />
      {cartDrawerLoaded && (
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
      )}
      {compareCount > 0 && (
        <Suspense fallback={null}>
          <CompareBar />
        </Suspense>
      )}

      <Suspense fallback={<PageLoadingState label="Loading page..." />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<AllCategories />} />
            <Route path="/products" element={<AllProducts />} />
            <Route path="/category/:categoryId" element={<ProductListing />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route path="/order-success/:orderId" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AccountDashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderId" element={<OrderDetail />} />
              <Route path="returns" element={<AccountReturns />} />
              <Route path="returns/:returnId" element={<ReturnDetail />} />
              <Route path="reviews" element={<AccountReviews />} />
              <Route path="addresses" element={<AccountAddresses />} />
              <Route path="profile" element={<AccountProfile />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/seller-login" element={<SellerLogin />} />
            <Route path="/astrologers" element={<AstrologerListing />} />
            <Route path="/astrologer/:id" element={<AstrologerDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/info/:slug" element={<InfoPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/refer-and-earn" element={<Referral />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="most-viewed" element={<AdminMostViewed />} />
            <Route path="theme" element={<AdminTheme />} />
            <Route path="homepage" element={<AdminHomepage />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:orderId" element={<AdminOrderDetail />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="contact-messages" element={<AdminContactMessages />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="login-activity" element={<AdminLoginActivity />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="policies" element={<AdminPolicies />} />
            <Route path="footer" element={<AdminFooter />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
