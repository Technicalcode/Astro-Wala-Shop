import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import {
  backendUrl,
  COMMON_CLOUDINARY_IMAGE_URL,
  fetchWithAuth as fetchWithAuthRequest,
  hasAuthCredentials,
  readApiResponse,
  toAssetUrl,
} from "../config/api";

const STORAGE_KEY = "astromart_guest_cart";
const PLACEHOLDER = COMMON_CLOUDINARY_IMAGE_URL;
const ADMIN_PURCHASE_ROLES = ["admin", "superAdmin", "orderManager"];
const ADMIN_PURCHASE_MESSAGE =
  "Admin accounts cannot add products to cart or place orders. Please use a customer account.";

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const toImageUrl = (image) => toAssetUrl(image, PLACEHOLDER);

const normalizeSelectedVariants = (selectedVariants = {}) => {
  if (!selectedVariants || typeof selectedVariants !== "object") return {};
  return Object.fromEntries(
    Object.entries(selectedVariants).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
};

const getProductId = (item = {}) => item.productId || item._id || item.id;

const buildDisplayId = (productId, selectedVariants = {}) => {
  const variantValues = Object.values(selectedVariants).filter(Boolean);
  return variantValues.length > 0 ? `${productId}-${variantValues.join("-")}` : productId;
};

const normalizeCartItem = (item = {}) => {
  const product = item.product && typeof item.product === "object" ? item.product : item;
  const productId = product._id || product.id || item.product || item.productId;

  if (!productId) return null;

  const selectedVariants = normalizeSelectedVariants(item.selectedVariants);
  const category = product.category_id && typeof product.category_id === "object"
    ? product.category_id._id || product.category_id.id
    : product.category_id || product.category || "";
  const categoryName = product.category_id && typeof product.category_id === "object"
    ? product.category_id.name
    : product.categoryName || "";
  const image = toImageUrl(product.image || item.image);
  const price = Number(item.price ?? product.price) || 0;

  return {
    id: buildDisplayId(productId, selectedVariants),
    productId,
    cartItemId: item._id || item.cartItemId,
    name: product.name || item.name || "",
    category,
    categoryName,
    brand: product.brand || item.brand || "",
    price,
    mrp: Number(item.mrp ?? product.mrp ?? product.price) || price,
    image,
    images: Array.isArray(product.images) ? product.images.map(toImageUrl) : [image],
    stock: Number(product.stock) || 0,
    qty: Number(item.quantity || item.qty) || 1,
    selectedVariants,
  };
};

const normalizeCartResponse = (data = {}) => {
  const items = data.data?.items || data.cart?.items || data.items || [];
  return Array.isArray(items) ? items.map(normalizeCartItem).filter(Boolean) : [];
};

const addLocalItem = (items, product, qty = 1) => {
  const nextProduct = {
    ...product,
    productId: product.productId || product._id || product.id,
    qty,
  };
  const existing = items.find((item) => item.id === nextProduct.id);

  if (existing) {
    existing.qty += qty;
  } else {
    items.push(nextProduct);
  }
};

const getStateCartItem = (state, id) =>
  state.cart.items.find((item) => item.id === id || item.cartItemId === id || item.productId === id);

const buildCouponItems = (items = []) =>
  items.map((item) => ({
    productId: item.productId || item._id || item.id,
    quantity: item.qty || item.quantity || 1,
  }));

const normalizeAppliedCoupon = (data = {}) => {
  const coupon = data.data?.coupon || data.coupon || {};
  const result = data.data || data;

  return {
    id: coupon.id,
    couponId: result.couponId || coupon.couponId,
    productId: result.productId || coupon.productId || coupon.product_id,
    productName: result.productName || coupon.productName || "",
    discount: Number(result.discount) || 0,
    eligibleSubtotal: Number(result.eligibleSubtotal) || 0,
    remainingUses: Number(result.remainingUses) || 0,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
};

export const fetchCart = createAsyncThunk("cart/fetch", async (_, thunkAPI) => {
  try {
    const guestItems = loadFromStorage();
    if (!hasAuthCredentials()) return { items: guestItems, local: true };

    const mergeableItems = guestItems
      .filter((item) => isMongoObjectId(item.productId || item.id))
      .map((item) => ({
        productId: item.productId || item.id,
        quantity: item.qty || item.quantity || 1,
        selectedVariants: item.selectedVariants,
      }));

    if (mergeableItems.length > 0) {
      const mergeRes = await fetchWithAuthRequest(`${backendUrl}/api/v1/cart/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: mergeableItems }),
      });
      const mergeData = await readApiResponse(mergeRes);

      if (!mergeRes.ok) {
        return thunkAPI.rejectWithValue(
          mergeData.message || "Failed to merge your guest cart",
        );
      }

      saveToStorage([]);
      return { items: normalizeCartResponse(mergeData), local: false };
    }

    const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/cart/get-all`);
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to fetch cart");

    return { items: normalizeCartResponse(data), local: false };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const addToCart = createAsyncThunk("cart/add", async (payload, thunkAPI) => {
  try {
    const user = thunkAPI.getState().auth.user;
    if (ADMIN_PURCHASE_ROLES.includes(user?.role)) {
      return thunkAPI.rejectWithValue(ADMIN_PURCHASE_MESSAGE);
    }

    const product = payload.product || payload;
    const qty = Number(payload.qty || product.qty || 1);
    const productId = getProductId(product);
    const selectedVariants = normalizeSelectedVariants(product.selectedVariants);
    const displayId = buildDisplayId(productId, selectedVariants);
    const existingItem = thunkAPI
      .getState()
      .cart.items.find((item) => item.id === displayId);
    const stock = Number(product.stock);
    const requestedQuantity = (existingItem?.qty || 0) + qty;

    if (Number.isFinite(stock) && stock >= 0 && requestedQuantity > stock) {
      return thunkAPI.rejectWithValue(
        stock === 0
          ? `${product.name} is out of stock.`
          : `${product.name} has only ${stock} item(s) in stock. You already have ${existingItem?.qty || 0} in your cart.`,
      );
    }

    if (!hasAuthCredentials() || !isMongoObjectId(productId)) {
      return { local: true, product: { ...product, productId }, qty };
    }

    const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/cart/single-add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        quantity: qty,
        selectedVariants,
        price: product.price,
        mrp: product.mrp,
      }),
    });
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to add product to cart");

    return { items: normalizeCartResponse(data) };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const updateQty = createAsyncThunk("cart/updateQty", async ({ id, qty }, thunkAPI) => {
  try {
    if (!Number.isInteger(Number(qty)) || Number(qty) < 1) {
      return thunkAPI.rejectWithValue("Quantity must be a positive whole number");
    }
    const user = thunkAPI.getState().auth.user;
    if (ADMIN_PURCHASE_ROLES.includes(user?.role)) {
      return thunkAPI.rejectWithValue(ADMIN_PURCHASE_MESSAGE);
    }

    const item = getStateCartItem(thunkAPI.getState(), id);

    if (!item) return thunkAPI.rejectWithValue("Cart item not found");
    if (!hasAuthCredentials() || !isMongoObjectId(item.productId)) {
      return { local: true, id, qty };
    }

    const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/cart/quantity`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartItemId: item.cartItemId,
        productId: item.productId,
        selectedVariants: item.selectedVariants,
        quantity: qty,
      }),
    });
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to update cart");

    return { items: normalizeCartResponse(data) };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const removeFromCart = createAsyncThunk("cart/remove", async (id, thunkAPI) => {
  try {
    const item = getStateCartItem(thunkAPI.getState(), id);

    if (!item) return thunkAPI.rejectWithValue("Cart item not found");
    if (!hasAuthCredentials() || !isMongoObjectId(item.productId)) {
      return { local: true, id };
    }

    const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/cart/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartItemId: item.cartItemId,
        productId: item.productId,
        selectedVariants: item.selectedVariants,
      }),
    });
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to remove product from cart");

    return { items: normalizeCartResponse(data) };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const clearCart = createAsyncThunk("cart/clear", async (_, thunkAPI) => {
  if (hasAuthCredentials()) {
    try {
      const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/cart/clear`, {
        method: "DELETE",
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to clear cart");
      }
      return { items: [], local: false };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to clear cart");
    }
  }

  return { items: [], local: true };
});

export const applyCoupon = createAsyncThunk("cart/applyCoupon", async (couponCode, thunkAPI) => {
  try {
    const items = buildCouponItems(thunkAPI.getState().cart.items);
    const invalidItem = items.find((item) => !isMongoObjectId(item.productId));

    if (!hasAuthCredentials()) {
      return thunkAPI.rejectWithValue("Please login to apply a coupon.");
    }

    if (items.length === 0) {
      return thunkAPI.rejectWithValue("Cart is empty.");
    }

    if (invalidItem) {
      return thunkAPI.rejectWithValue("Please remove old demo products and add them again.");
    }

    const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/coupon/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        couponId: couponCode,
        items,
      }),
    });
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to apply coupon");

    return normalizeAppliedCoupon(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

const initialState = {
  items: loadFromStorage(),
  appliedCoupon: null,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },
    resetCartSession: (state) => {
      state.items = loadFromStorage();
      state.appliedCoupon = null;
      state.loading = false;
      state.error = null;
    },
    clearCartSession: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.loading = false;
      state.error = null;
      saveToStorage([]);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        if (action.payload.local) saveToStorage(state.items);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        if (action.payload.local) {
          addLocalItem(state.items, action.payload.product, action.payload.qty);
        } else {
          state.items = action.payload.items;
        }
        state.appliedCoupon = null;
        state.error = null;
        if (action.payload.local) saveToStorage(state.items);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateQty.fulfilled, (state, action) => {
        if (action.payload.local) {
          const item = state.items.find((cartItem) => cartItem.id === action.payload.id);
          if (item && action.payload.qty >= 1) item.qty = action.payload.qty;
        } else {
          state.items = action.payload.items;
        }
        state.appliedCoupon = null;
        state.error = null;
        if (action.payload.local) saveToStorage(state.items);
      })
      .addCase(updateQty.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        if (action.payload.local) {
          state.items = state.items.filter((item) => item.id !== action.payload.id);
        } else {
          state.items = action.payload.items;
        }
        state.appliedCoupon = null;
        state.error = null;
        if (action.payload.local) saveToStorage(state.items);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.items = [];
        state.appliedCoupon = null;
        state.error = null;
        if (action.payload.local) saveToStorage([]);
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.appliedCoupon = action.payload;
        state.error = null;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.appliedCoupon = null;
        state.error = action.payload;
      });
  },
});

export const { removeCoupon, resetCartSession, clearCartSession } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectAppliedCoupon = (state) => state.cart.appliedCoupon;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;

export const selectCartTotals = createSelector(
  [(state) => state.cart.items, (state) => state.cart.appliedCoupon],
  (items, appliedCoupon) => {
  const itemSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const mrpTotal = items.reduce((sum, item) => sum + (item.mrp || item.price) * item.qty, 0);
  const couponDiscount = Math.min(
    itemSubtotal,
    Math.max(0, Number(appliedCoupon?.discount) || 0),
  );
  const subtotal = Math.max(0, itemSubtotal - couponDiscount);
  const productSavings = Math.max(0, mrpTotal - itemSubtotal);
  const totalSavings = productSavings + couponDiscount;
  const itemCount = items.length;

  return { subtotal, itemSubtotal, mrpTotal, totalSavings, productSavings, couponDiscount, itemCount };
  },
);

export default cartSlice.reducer;
