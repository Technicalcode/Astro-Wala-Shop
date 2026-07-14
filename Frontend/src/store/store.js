import { configureStore } from "@reduxjs/toolkit";
import wishlistReducer from "./wishlistSlice";
import cartReducer from "./cartSlice";
import authReducer from "./authSlice";
import compareReducer from "./compareSlice";
import themeReducer from "./themeSlice";
import editableStyleReducer from "./editableStyleSlice";
import referralReducer from "./referralSlice";
import festivalReducer from "./festivalSlice";
import categoriesReducer from "./categoriesSlice";
import ordersReducer from "./ordersSlice";
import productsReducer from "./productsSlice";
import recentlyViewedReducer from "./recentlyViewedSlice";
import bannerReducer from "./bannerSlice";
import policyReducer from "./policySlice";
import reviewReducer from "./reviewSlice";
import { loadingMiddleware } from "./loadingMiddleware";
import { errorNotificationMiddleware } from "./errorNotificationMiddleware";
import cartUiReducer from "./cartUiSlice";
import couponReducer from "./couponSlice";

const channel = new BroadcastChannel('app_state_sync');

const syncMiddleware = () => (next) => (action) => {
  // If the action came from another tab, process it normally without rebroadcasting
  if (action.meta?.fromChannel) {
    return next(action);
  }

  // Process the action locally first
  const result = next(action);

  // Broadcast local actions to other tabs (ignore internal Redux actions)
  if (action.type && !action.type.startsWith('@@')) {
    channel.postMessage(action);
  }

  return result;
};

export const store = configureStore({
  reducer: {
    wishlist: wishlistReducer,
    cart: cartReducer,
    auth: authReducer,
    compare: compareReducer,
    theme: themeReducer,
    editableStyle: editableStyleReducer,
    referral: referralReducer,
    festival: festivalReducer,
    categories: categoriesReducer,
    orders: ordersReducer,
    products: productsReducer,
    recentlyViewed: recentlyViewedReducer,
    banner: bannerReducer,
    policies: policyReducer,
    reviews: reviewReducer,
    cartUi: cartUiReducer,
    coupon: couponReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(
      loadingMiddleware,
      errorNotificationMiddleware,
      syncMiddleware,
    ),
});

// Listen for actions from other tabs and dispatch them locally
channel.onmessage = (event) => {
  const action = event.data;
  if (action && action.type) {
    store.dispatch({
      ...action,
      meta: { ...action.meta, fromChannel: true }
    });
  }
};
