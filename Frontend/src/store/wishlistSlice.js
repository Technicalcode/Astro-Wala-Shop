import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  backendUrl,
  COMMON_CLOUDINARY_IMAGE_URL,
  fetchWithAuth as fetchWithAuthRequest,
  hasAuthCredentials,
  toAssetUrl,
} from "../config/api";

const STORAGE_KEY = "astromart_wishlist_v2";
const PLACEHOLDER = COMMON_CLOUDINARY_IMAGE_URL;

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

const readApiResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const toImageUrl = (image) => toAssetUrl(image, PLACEHOLDER);

const normalizeProduct = (product = {}) => {
  const id = product._id || product.id;
  if (!id) return null;

  const category =
    product.category_id && typeof product.category_id === "object"
      ? product.category_id._id || product.category_id.id
      : product.category_id || product.category || "";
  const categoryName =
    product.category_id && typeof product.category_id === "object"
      ? product.category_id.name
      : product.categoryName || "";
  const image = toImageUrl(product.image);

  return {
    id,
    productId: id,
    name: product.name || "",
    category,
    categoryName,
    brand: product.brand || "",
    price: Number(product.price) || 0,
    mrp: Number(product.mrp || product.price) || 0,
    rating: Number(product.rating) || 4.5,
    ratingCount: Number(product.ratingCount) || 120,
    image,
    images: Array.isArray(product.images) ? product.images.map(toImageUrl) : [image],
    description: product.description || "",
    highlights: Array.isArray(product.producthightlight)
      ? product.producthightlight
      : typeof product.producthightlight === "string"
        ? product.producthightlight.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
    stock: Number(product.stock) || 0,
  };
};

const normalizeWishlistResponse = (data = {}) => {
  const products = data.data?.products || data.products || [];
  const normalizedProducts = Array.isArray(products)
    ? products.map(normalizeProduct).filter(Boolean)
    : [];

  return {
    wishlistIds: normalizedProducts.map((product) => String(product.id)),
    products: normalizedProducts,
  };
};

export const fetchWishlist = createAsyncThunk("wishlist/fetch", async (_, thunkAPI) => {
  try {
    if (!hasAuthCredentials()) {
      return {
        wishlistIds: loadFromStorage(),
        products: [],
      };
    }

    const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/wishlist/get-wishlist`);
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to fetch wishlist");

    return normalizeWishlistResponse(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const toggleWishlist = createAsyncThunk("wishlist/toggle", async (product, thunkAPI) => {
  try {
    const productId = String(product.productId || product._id || product.id || "");
    const state = thunkAPI.getState();
    const wishlisted = state.wishlist.wishlistIds.includes(productId);

    if (!hasAuthCredentials()) {
      return thunkAPI.rejectWithValue("Please login to update wishlist.");
    }

    if (!isMongoObjectId(productId)) {
      return thunkAPI.rejectWithValue(
        "This product is not synced with the database. Please refresh and add it again.",
      );
    }

    const res = await fetchWithAuthRequest(
      `${backendUrl}/api/v1/wishlist/${wishlisted ? "remove-wishlist" : "add-wishlist"}/${productId}`,
      {
        method: wishlisted ? "DELETE" : "POST",
      },
    );
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to update wishlist");

    return normalizeWishlistResponse(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    wishlistIds: loadFromStorage(),
    products: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearWishlist: (state) => {
      state.wishlistIds = [];
      state.products = [];
      saveToStorage([]);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlistIds = action.payload.wishlistIds;
        state.products = action.payload.products;
        saveToStorage(state.wishlistIds);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.wishlistIds = action.payload.wishlistIds;
        state.products = action.payload.products;
        state.error = null;
        saveToStorage(state.wishlistIds);
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;

export const selectWishlistIds = (state) => state.wishlist.wishlistIds;
export const selectWishlistProducts = (state) => state.wishlist.products;
export const selectWishlistLoading = (state) => state.wishlist.loading;
export const selectWishlistError = (state) => state.wishlist.error;

export default wishlistSlice.reducer;
