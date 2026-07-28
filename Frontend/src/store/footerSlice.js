import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { backendUrl, fetchWithAuth, readApiResponse } from "../config/api";

export const defaultFooterSettings = {
  trustBadges: [
    { label: "Certified Products", icon: "shield", position: 1, enabled: true },
    { label: "Free Delivery", icon: "truck", position: 2, enabled: true },
    { label: "7 Day Returns", icon: "return", position: 3, enabled: true },
    { label: "Verified Astrologers", icon: "verified", position: 4, enabled: true },
  ],
  sections: [
    {
      key: "about",
      title: "ABOUT",
      position: 1,
      enabled: true,
      links: [
        { label: "Contact Us", to: "/contact", position: 1, enabled: true },
        { label: "About Us", to: "/info/about", position: 2, enabled: true },
        { label: "Careers", to: "/info/careers", position: 3, enabled: true },
        { label: "Press", to: "/info/press", position: 4, enabled: true },
      ],
    },
    {
      key: "help",
      title: "HELP",
      position: 2,
      enabled: true,
      links: [
        { label: "Payments", to: "/info/payments", position: 1, enabled: true },
        { label: "Shipping", to: "/info/shipping", position: 2, enabled: true },
        { label: "Cancellation & Returns", to: "/info/returns", position: 3, enabled: true },
        { label: "FAQ", to: "/info/faq", position: 4, enabled: true },
      ],
    },
    { key: "policy", title: "POLICY", position: 3, enabled: true, links: [] },
  ],
  contact: {
    phone: "+91 63983 93497",
    email: "adityak74920@gmail.com",
    address: "Astro Wala Shop Commerce Pvt. Ltd.\nIDPL, Rishikesh,\nUttarakhand 249201",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=IDPL+Rishikesh+Uttarakhand",
  },
  newsletterEnabled: true,
};

const sortByPosition = (items = []) =>
  [...items].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));

const normalizeLink = (link = {}, index = 0) => ({
  id: link.id || link._id || `link-${index}`,
  label: link.label || "",
  to: link.to || "",
  position: Number(link.position) || index + 1,
  enabled: link.enabled !== false,
});

const normalizeSection = (section = {}, index = 0) => ({
  id: section.id || section._id || `section-${section.key || index}`,
  key: section.key || `section-${index + 1}`,
  title: section.title || "",
  position: Number(section.position) || index + 1,
  enabled: section.enabled !== false,
  links: sortByPosition(section.links || []).map(normalizeLink),
});

const normalizeBadge = (badge = {}, index = 0) => ({
  id: badge.id || badge._id || `badge-${index}`,
  label: badge.label || "",
  icon: badge.icon || "shield",
  position: Number(badge.position) || index + 1,
  enabled: badge.enabled !== false,
});

export const normalizeFooterSettings = (settings = defaultFooterSettings) => ({
  id: settings.id || settings._id || "default",
  sections: sortByPosition(settings.sections || defaultFooterSettings.sections).map(normalizeSection),
  trustBadges: sortByPosition(settings.trustBadges || defaultFooterSettings.trustBadges).map(normalizeBadge),
  contact: {
    ...defaultFooterSettings.contact,
    ...(settings.contact || {}),
  },
  newsletterEnabled: settings.newsletterEnabled !== false,
});

export const fetchFooterSettings = createAsyncThunk("footer/fetchSettings", async (_, thunkAPI) => {
  try {
    const res = await fetch(`${backendUrl}/api/v1/footer/settings`);
    const data = await readApiResponse(res);

    if (!res.ok) {
      return thunkAPI.rejectWithValue(data.message || "Failed to fetch footer settings");
    }

    return normalizeFooterSettings(data.data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch footer settings");
  }
});

export const saveFooterSettings = createAsyncThunk("footer/saveSettings", async (settings, thunkAPI) => {
  try {
    const res = await fetchWithAuth(`${backendUrl}/api/v1/footer/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeFooterSettings(settings)),
    });
    const data = await readApiResponse(res);

    if (!res.ok) {
      return thunkAPI.rejectWithValue(data.message || "Failed to save footer settings");
    }

    return normalizeFooterSettings(data.data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to save footer settings");
  }
});

const footerSlice = createSlice({
  name: "footer",
  initialState: {
    settings: defaultFooterSettings,
    loading: false,
    loaded: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFooterSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFooterSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.settings = action.payload;
      })
      .addCase(fetchFooterSettings.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload;
      })
      .addCase(saveFooterSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveFooterSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.settings = action.payload;
      })
      .addCase(saveFooterSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const selectFooterSettings = (state) => state.footer.settings;
export const selectFooterLoading = (state) => state.footer.loading;
export const selectFooterLoaded = (state) => state.footer.loaded;
export const selectFooterSaving = (state) => state.footer.saving;
export const selectFooterError = (state) => state.footer.error;

export default footerSlice.reducer;
