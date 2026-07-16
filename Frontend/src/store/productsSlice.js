import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { backendUrl, COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../config/api";
import { showErrorPopup } from "../utils/notificationCenter";

const PLACEHOLDER = COMMON_CLOUDINARY_IMAGE_URL;

const toImageUrl = (image) => toAssetUrl(image, PLACEHOLDER);

const normalizeToken = (value) => {
  if (typeof value !== "string") return "";

  let token = value.replace(/['"]+/g, "").trim();
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }

  if (
    !token ||
    token === "[object Object]" ||
    token === "undefined" ||
    token === "null"
  ) {
    return "";
  }

  return token;
};

const getStoredAccessToken = () => {
  const token = normalizeToken(localStorage.getItem("astromart_token") || "");
  if (!token) localStorage.removeItem("astromart_token");
  return token;
};

const getAuthHeader = () => {
  const token = getStoredAccessToken();
  return token ? `Bearer ${token}` : "";
};

const getTokensFromResponse = (data = {}) => {
  const tokenPayload = data.token;

  return {
    accessToken: normalizeToken(
      typeof tokenPayload === "string"
        ? tokenPayload
        : tokenPayload?.accessToken || data.accessToken || data.data?.accessToken || ""
    ),
    refreshToken:
      (typeof tokenPayload === "object" && tokenPayload?.refreshToken) ||
      data.refreshToken ||
      data.data?.refreshToken ||
      "",
  };
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("astromart_refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await fetch(`${backendUrl}/api/v1/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to refresh token");
  }

  const { accessToken, refreshToken: newRefreshToken } = getTokensFromResponse(data);
  if (accessToken) {
    localStorage.setItem("astromart_token", accessToken);
    if (newRefreshToken && typeof newRefreshToken === "string") {
      localStorage.setItem("astromart_refresh_token", newRefreshToken);
    }
    return accessToken;
  }
  throw new Error("No token in refresh response");
};

const fetchWithAuth = async (url, options = {}) => {
  let res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: getAuthHeader() },
  });

  if (res.status === 401) {
    const token = getStoredAccessToken();
    const refreshToken = localStorage.getItem("astromart_refresh_token");

    if (token || refreshToken) {
      try {
        await refreshAccessToken();
        res = await fetch(url, {
          ...options,
          headers: { ...options.headers, Authorization: getAuthHeader() },
        });
      } catch (err) {
        showErrorPopup("Your session has expired. Please log in again.", {
          title: "Session expired",
          status: 401,
          duration: 0,
        });
        localStorage.removeItem("astromart_token");
        localStorage.removeItem("astromart_refresh_token");
        window.location.href = "/login";
        throw err;
      }
    }
  }
  return res;
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

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      let res = await fetch(`${backendUrl}/api/v1/product/all-product`);
      if (res.status === 401 && localStorage.getItem("astromart_token")) {
        res = await fetchWithAuth(`${backendUrl}/api/v1/product/all-product`);
      }

      const data = await readApiResponse(res);
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch products");

      const productsArray = data.data || data.products || data;
      return Array.isArray(productsArray)
        ? productsArray
            .map((p) => {
              if (!p) return null;

              const sizeOptions =
                typeof p.size === "string"
                  ? p.size.split(",").map((s) => s.trim()).filter(Boolean)
                  : Array.isArray(p.size)
                    ? p.size
                    : ["Standard"];

              const variants = [
                {
                  name: "Size",
                  options: sizeOptions.map((opt) => ({
                    name: typeof opt === "object" ? opt.name : String(opt),
                    price: Number(p.price) || 0,
                    mrp: Number(p.mrp || p.price) || 0,
                  })),
                },
              ];

              const highlights = Array.isArray(p.producthightlight)
                ? p.producthightlight
                : typeof p.producthightlight === "string"
                  ? p.producthightlight.split(",").map((h) => h.trim()).filter(Boolean)
                  : p.producthightlight
                    ? [String(p.producthightlight)]
                    : [];

              const catId =
                p.category_id && typeof p.category_id === "object"
                  ? p.category_id._id || p.category_id.id
                  : p.category && typeof p.category === "object"
                    ? p.category._id || p.category.id
                    : p.category_id || p.category || "";
              const catName =
                p.category_id && typeof p.category_id === "object"
                  ? p.category_id.name
                  : p.category && typeof p.category === "object"
                    ? p.category.name
                    : "";
              const image = toImageUrl(p.image);

              const ratingCount = Number(p.ratingCount ?? p.reviewCount ?? 0);
              const rating =
                p.rating !== undefined || p.ratingCount !== undefined
                  ? Number(p.rating) || 0
                  : 4.5;

              return {
                id: p._id || p.id,
                name: p.name || "",
                category: catId,
                categoryName: catName || "",
                brand: p.brand || "",
                price: Number(p.price) || 0,
                mrp: Number(p.mrp || p.price) || 0,
                rating,
                ratingCount,
                image,
                images: Array.isArray(p.images) ? p.images.map(toImageUrl) : [image],
                description: p.description || "",
                highlights,
                reviews: Array.isArray(p.reviews) ? p.reviews : [],
                stock: Number(p.stock) || 0,
                bestseller: Boolean(p.bestseller),
                createdAt: p.createdAt || "",
                updatedAt: p.updatedAt || "",
                viewCount: Number(p.viewCount) || 0,
                variants,
              };
            })
            .filter(Boolean)
        : [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createProduct = createAsyncThunk(
  "products/create",
  async (productData, thunkAPI) => {
    try {
      const body = new FormData();
      body.append("name", productData.name);
      body.append("description", productData.description || "");
      body.append("price", String(productData.price));
      body.append("mrp", String(productData.mrp || productData.price));
      body.append("category_id", productData.category);
      body.append("brand", productData.brand || "");
      body.append("stock", String(productData.stock || 100));
      body.append("bestseller", String(Boolean(productData.bestseller)));

      const sizeValue =
        productData.variants && productData.variants[0]
          ? productData.variants[0].options.map((opt) => opt.name).join(", ")
          : "Standard";
      body.append("size", sizeValue);

      const highlightsValue =
        productData.highlights && Array.isArray(productData.highlights)
          ? productData.highlights.join(", ")
          : "";
      body.append("producthightlight", highlightsValue);

      if (productData.imageFile) {
        body.append("User_image", productData.imageFile);
      }

      const res = await fetchWithAuth(`${backendUrl}/api/v1/product/create`, {
        method: "POST",
        body,
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        return thunkAPI.rejectWithValue(
          data.message || data.error || `Failed to create product (${res.status})`,
        );
      }

      thunkAPI.dispatch(fetchProducts());
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, patch }, thunkAPI) => {
    try {
      const existing =
        selectAllProducts(thunkAPI.getState()).find((product) => product.id === id) || {};
      const product = { ...existing, ...patch };

      const body = new FormData();
      if (product.name !== undefined) body.append("name", product.name);
      if (product.description !== undefined) body.append("description", product.description || "");
      if (product.price !== undefined) body.append("price", String(product.price));
      if (product.mrp !== undefined) body.append("mrp", String(product.mrp || product.price || 0));
      if (product.category !== undefined) body.append("category_id", product.category);
      if (product.brand !== undefined) body.append("brand", product.brand || "");
      if (product.stock !== undefined) body.append("stock", String(product.stock));
      if (product.bestseller !== undefined) body.append("bestseller", String(Boolean(product.bestseller)));

      const sizeValue =
        product.variants && product.variants[0]
          ? product.variants[0].options.map((opt) => opt.name).join(", ")
          : "Standard";
      body.append("size", sizeValue);

      const highlightsValue =
        product.highlights && Array.isArray(product.highlights)
          ? product.highlights.join(", ")
          : "";
      body.append("producthightlight", highlightsValue);

      if (patch.imageFile) {
        body.append("User_image", patch.imageFile);
      }

      const res = await fetchWithAuth(`${backendUrl}/api/v1/product/update/${id}`, {
        method: "PUT",
        body,
      });
      const data = await readApiResponse(res);
      if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to update product");

      thunkAPI.dispatch(fetchProducts());
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/product/delete/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await readApiResponse(res);
        return thunkAPI.rejectWithValue(data.message || "Failed to delete product");
      }
      thunkAPI.dispatch(fetchProducts());
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
      });
  },
});

export const selectAllProducts = (state) => state.products.items;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsError = (state) => state.products.error;

export const selectProductById = (id) =>
  createSelector([selectAllProducts], (allProducts) => allProducts.find((p) => p.id === id));

export const selectProductsByCategory = (categoryId) =>
  createSelector([selectAllProducts], (allProducts) =>
    allProducts.filter((p) => p.category === categoryId),
  );

export const searchProductsSelector = (query) =>
  createSelector([selectAllProducts], (allProducts) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)),
    );
  });

export default productsSlice.reducer;
