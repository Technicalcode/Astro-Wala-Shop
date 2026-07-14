import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { backendUrl, COMMON_CLOUDINARY_IMAGE_URL, toAssetUrl } from "../config/api";

const toImageUrl = (image) => toAssetUrl(image, COMMON_CLOUDINARY_IMAGE_URL);

// ─── Helper: get a valid auth header ────────────────────────────────────────
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

const getAuthHeader = () => {
  const token = normalizeToken(localStorage.getItem("astromart_token") || "");
  if (!token) {
    localStorage.removeItem("astromart_token");
    return "";
  }
  return `Bearer ${token}`;
};

// ─── Helper: auto refresh token if expired, then retry original request ─────
const fetchWithAutoRefresh = async (url, options = {}) => {
  // First attempt
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: getAuthHeader() },
  });

  // If 401, try to refresh token and retry once
  if (res.status === 401) {
    const refreshToken = localStorage.getItem("astromart_refresh_token");
    if (!refreshToken) return res; // no refresh token available, return original 401

    try {
      const refreshRes = await fetch(`${backendUrl}/api/v1/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();

        // Save new tokens - handle different response shapes
        let newAccessToken = null;
        let newRefreshToken = null;

        if (refreshData.token) {
          if (typeof refreshData.token === "object") {
            newAccessToken = refreshData.token.accessToken;
            newRefreshToken = refreshData.token.refreshToken;
          } else {
            newAccessToken = refreshData.token;
          }
        } else if (refreshData.data?.accessToken) {
          newAccessToken = refreshData.data.accessToken;
          newRefreshToken = refreshData.data.refreshToken;
        } else if (refreshData.accessToken) {
          newAccessToken = refreshData.accessToken;
          newRefreshToken = refreshData.refreshToken;
        }

        const accessToken = normalizeToken(newAccessToken || "");
        if (accessToken) {
          localStorage.setItem("astromart_token", accessToken);
          if (newRefreshToken)
            localStorage.setItem("astromart_refresh_token", newRefreshToken);

          // Retry original request with new token
          return fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
          });
        }
      }
    } catch (_) {
      // Refresh failed silently
    }
  }

  return res;
};

// ─── Thunks ─────────────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchWithAutoRefresh(
        `${backendUrl}/api/v1/category/Get-all`
      );
      const data = await res.json();
      if (!data.success && !data.sucess) return rejectWithValue(data.message);

      const categoriesArray = data.data || data.categories || data;

      return Array.isArray(categoriesArray)
        ? categoriesArray.map((cat) => {
            let catColor = cat.themecolor || cat.color || "#000000";
            if (!catColor.startsWith("#")) catColor = "#" + catColor;
            return {
              id: cat._id,
              name: cat.name,
              slug: cat.slug,
              tagline: cat.tagline,
              color: catColor,
              image: toImageUrl(cat.image),
              icon: "Folder",
              createdAt: cat.createdAt || "",
              updatedAt: cat.updatedAt || "",
            };
          })
        : [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (categoryData, thunkAPI) => {
    try {
      const body = new FormData();
      body.append("name", categoryData.name);
      body.append("tagline", categoryData.tagline);
      body.append("themecolor", categoryData.color);
      if (categoryData.imageFile) {
        body.append("User_image", categoryData.imageFile);
      }

      const res = await fetchWithAutoRefresh(
        `${backendUrl}/api/v1/category/create`,
        { method: "POST", body }
      );
      const data = await res.json();

      if (!res.ok)
        return thunkAPI.rejectWithValue(data.message || "Failed to create");

      thunkAPI.dispatch(fetchCategories());
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async (categoryData, thunkAPI) => {
    try {
      const body = new FormData();
      body.append("name", categoryData.name);
      body.append("tagline", categoryData.tagline);
      body.append("themecolor", categoryData.color);
      if (categoryData.imageFile) {
        body.append("User_image", categoryData.imageFile);
      }

      const res = await fetchWithAutoRefresh(
        `${backendUrl}/api/v1/category/update/${categoryData.id}`,
        { method: "PUT", body }
      );
      const data = await res.json();

      if (!res.ok)
        return thunkAPI.rejectWithValue(data.message || "Failed to update");

      thunkAPI.dispatch(fetchCategories());
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id, thunkAPI) => {
    try {
      const res = await fetchWithAutoRefresh(
        `${backendUrl}/api/v1/category/delete/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        return thunkAPI.rejectWithValue(data.message || "Failed to delete");
      }

      thunkAPI.dispatch(fetchCategories());
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectCategories = (state) => state.categories.items;
export const selectCategoriesLoading = (state) => state.categories.loading;
export const selectCategoryById = (state, id) =>
  state.categories.items.find((c) => c.id === id);

export default categoriesSlice.reducer;
