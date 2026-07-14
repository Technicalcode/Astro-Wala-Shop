import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  backendUrl,
  DEFAULT_BANNER_CLOUDINARY_URL,
  fetchWithAuth,
  readApiResponse,
  toAssetUrl,
} from "../config/api";

const fallbackSlide = {
  id: "fallback-banner",
  title: "",
  titleColor: "#ffffff",
  subtitle: "",
  subtitleColor: "#f3f4f6",
  cta: "Shop Now",
  ctaBg: "#ffffff",
  ctaText: "#000000",
  to: "/category/pooja",
  bg: `url('${DEFAULT_BANNER_CLOUDINARY_URL}')`,
  rawBg: DEFAULT_BANNER_CLOUDINARY_URL,
  alignment: "bottom-center",
  overlayOpacity: 0,
  isActive: true,
  order: 0,
};

const toImageUrl = (image) => {
  const value = String(image || "").trim();
  if (value.startsWith("url(")) return value.slice(4, -1).replace(/^['"]|['"]$/g, "");
  return toAssetUrl(value, DEFAULT_BANNER_CLOUDINARY_URL);
};

const normalizeBanner = (banner = {}) => {
  const image = toImageUrl(banner.bg);

  return {
    id: banner._id || banner.id,
    bg: image ? `url('${image}')` : fallbackSlide.bg,
    rawBg: image,
    title: banner.title || "",
    titleColor: banner.titleColor || "#ffffff",
    subtitle: banner.subtitle || "",
    subtitleColor: banner.subtitleColor || "#f3f4f6",
    cta: banner.cta || "",
    ctaBg: banner.ctaBg || "#ffffff",
    ctaText: banner.ctaText || "#000000",
    overlayOpacity: Number(banner.overlayOpacity) || 0,
    alignment: banner.alignment || "bottom-center",
    to: banner.to || "/",
    isActive: banner.isActive !== false,
    order: Number(banner.order) || 0,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };
};

const buildFormData = ({ form, imageFile }) => {
  const body = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.append(key, value);
    }
  });

  if (imageFile) body.append("banner_image", imageFile);

  return body;
};

export const fetchBanners = createAsyncThunk(
  "banner/fetchAll",
  async ({ includeInactive = false } = {}, thunkAPI) => {
    try {
      const qs = includeInactive ? "?includeInactive=true" : "";
      const res = await fetch(`${backendUrl}/api/v1/banner/all-banners${qs}`);
      const data = await readApiResponse(res);

      if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to fetch banners");

      return (data.data || []).map(normalizeBanner);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const createBanner = createAsyncThunk(
  "banner/create",
  async ({ form, imageFile }, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/banner/create`, {
        method: "POST",
        body: buildFormData({ form, imageFile }),
      });
      const data = await readApiResponse(res);

      if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to create banner");

      return normalizeBanner(data.data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const updateBanner = createAsyncThunk(
  "banner/update",
  async ({ id, form, imageFile }, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/banner/update/${id}`, {
        method: "PUT",
        body: buildFormData({ form, imageFile }),
      });
      const data = await readApiResponse(res);

      if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to update banner");

      return normalizeBanner(data.data);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const deleteBanner = createAsyncThunk("banner/delete", async (id, thunkAPI) => {
  try {
    const res = await fetchWithAuth(`${backendUrl}/api/v1/banner/delete/${id}`, {
      method: "DELETE",
    });
    const data = await readApiResponse(res);

    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to delete banner");

    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

const bannerSlice = createSlice({
  name: "banner",
  initialState: {
    slides: [fallbackSlide],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.slides = action.payload.length > 0 ? action.payload : [fallbackSlide];
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.slides = [action.payload, ...state.slides.filter((slide) => slide.id !== fallbackSlide.id)]
          .sort((a, b) => a.order - b.order);
        state.error = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        const index = state.slides.findIndex((slide) => slide.id === action.payload.id);
        if (index !== -1) state.slides[index] = action.payload;
        state.slides.sort((a, b) => a.order - b.order);
        state.error = null;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.slides = state.slides.filter((slide) => slide.id !== action.payload);
        if (state.slides.length === 0) state.slides = [fallbackSlide];
        state.error = null;
      });
  },
});

export const selectBannerSlides = (state) => state.banner.slides;
export const selectBannerLoading = (state) => state.banner.loading;
export const selectBannerError = (state) => state.banner.error;

export default bannerSlice.reducer;
