import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectBgColor, fetchThemeSettings } from "./store/themeSlice";
import { selectUser, syncUserProfile } from "./store/authSlice";
import { refreshFestivals } from "./store/festivalSlice";
import { fetchCategories } from "./store/categoriesSlice";
import { fetchProducts } from "./store/productsSlice";
import { fetchCart } from "./store/cartSlice";
import { fetchWishlist } from "./store/wishlistSlice";
import { fetchAvailableCoupons } from "./store/couponSlice";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import CompareBar from "./components/CompareBar";
import GlobalLoadingBar from "./components/GlobalLoadingBar";
import CartDrawer from "./components/CartDrawer";
import PageTracker from "./components/PageTracker";

import Home from "./pages/Home";
import AllCategories from "./pages/AllCategories";
import AllProducts from "./pages/AllProducts";
import ProductListing from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountLayout from "./pages/account/AccountLayout";
import AccountDashboard from "./pages/account/AccountDashboard";
import AccountProfile from "./pages/account/AccountProfile";
import AccountAddresses from "./pages/account/AccountAddresses";
import OrderDetail from "./pages/account/OrderDetail";
import AccountReturns from "./pages/account/AccountReturns";
import ReturnDetail from "./pages/account/ReturnDetail";
import AccountReviews from "./pages/account/AccountReviews";
import SellerLogin from "./pages/SellerLogin";
import AstrologerListing from "./pages/AstrologerListing";
import AstrologerDetail from "./pages/AstrologerDetail";
import SearchResults from "./pages/SearchResults";
import Contact from "./pages/Contact";
import InfoPage from "./pages/InfoPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Referral from "./pages/Referral";
import Wishlist from "./pages/Wishlist";
import Compare from "./pages/Compare";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMostViewed from "./pages/admin/AdminMostViewed";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminReturns from "./pages/admin/AdminReturns";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminPolicies from "./pages/admin/AdminPolicies";
import AdminLoginActivity from "./pages/admin/AdminLoginActivity";
import AdminHomepage from "./pages/admin/AdminHomepage";
import AdminTheme from "./pages/admin/AdminTheme";
import AdminReferrals from "./pages/admin/AdminReferrals";

export default function App() {
  const dispatch = useDispatch();
  const bgColor = useSelector(selectBgColor);
  const user = useSelector(selectUser);

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
      <CartDrawer />
      {/* CompareBar floats above everything */}
      <CompareBar />

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
                                <Route path="returns" element={<AdminReturns />} />
                                <Route path="users" element={<AdminUsers />} />
                                <Route path="audit-logs" element={<AdminAuditLogs />} />
                                <Route path="login-activity" element={<AdminLoginActivity />} />
                                <Route path="banners" element={<AdminBanners />} />
                                <Route path="policies" element={<AdminPolicies />} />
                              </Route>
                            </Routes>
    </BrowserRouter>
  );
}
