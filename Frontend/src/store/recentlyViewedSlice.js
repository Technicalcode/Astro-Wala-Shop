import { createSlice } from "@reduxjs/toolkit";
import { COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../config/api";

const STORAGE_KEY = "astromart_recently_viewed_v1";
const MAX_ITEMS = 8;

const normalizeStoredProduct = (product = {}) => {
  const image = toAssetUrl(product.image || product.images?.[0], COMMON_CLOUDINARY_IMAGE_URL);
  return {
    ...product,
    image,
    images: Array.isArray(product.images)
      ? product.images.map((item) => toAssetUrl(item, COMMON_CLOUDINARY_IMAGE_URL))
      : [image],
  };
};

const loadRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const products = stored ? JSON.parse(stored) : [];
    return Array.isArray(products) ? products.map(normalizeStoredProduct) : [];
  } catch {
    return [];
  }
};

const saveRecentlyViewed = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable
  }
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState: {
    items: loadRecentlyViewed(),
  },
  reducers: {
    trackProduct: (state, action) => {
      const product = normalizeStoredProduct(action.payload);
      if (!product?.id) return;
      
      const filtered = state.items.filter((p) => p.id !== product.id);
      state.items = [product, ...filtered].slice(0, MAX_ITEMS);
      
      saveRecentlyViewed(state.items);
    },
  },
});

export const { trackProduct } = recentlyViewedSlice.actions;

export const selectRecentlyViewed = (state) => state.recentlyViewed.items;

export default recentlyViewedSlice.reducer;
