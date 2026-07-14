import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { backendUrl, trackedFetch, fetchWithAuth, readApiResponse } from "../config/api";

const STORAGE_KEY = "astromart_site_bg";
export const DEFAULT_BG = "#F1F3F6";

const loadBgColor = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BG;
  } catch {
    return DEFAULT_BG;
  }
};

export const fetchThemeSettings = createAsyncThunk("theme/fetchSettings", async (_, { rejectWithValue }) => {
  try {
    const res = await trackedFetch(`${backendUrl}/api/v1/homepage/settings`);
    const data = await readApiResponse(res);
    if (!res.ok) throw new Error(data.message || "Failed to load settings");
    return data.data?.backgroundColor || DEFAULT_BG;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const saveBgColor = createAsyncThunk("theme/saveBgColor", async (color, { rejectWithValue }) => {
  try {
    const res = await fetchWithAuth(`${backendUrl}/api/v1/admin/homepage/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundColor: color }),
    });
    const data = await readApiResponse(res);
    if (!res.ok) throw new Error(data.message || "Failed to save settings");
    return data.data?.backgroundColor || color;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    bgColor: loadBgColor(),
  },
  reducers: {
    setBgColor: (state, action) => {
      state.bgColor = action.payload;
      try {
        localStorage.setItem(STORAGE_KEY, action.payload);
      } catch {
        /* ignore */
      }
    },
    resetBgColor: (state) => {
      state.bgColor = DEFAULT_BG;
      try {
        localStorage.setItem(STORAGE_KEY, DEFAULT_BG);
      } catch {
        /* ignore */
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThemeSettings.fulfilled, (state, action) => {
        if (action.payload) {
          state.bgColor = action.payload;
          try {
            localStorage.setItem(STORAGE_KEY, action.payload);
          } catch {
            /* ignore */
          }
        }
      })
      .addCase(saveBgColor.fulfilled, (state, action) => {
        state.bgColor = action.payload;
        try {
          localStorage.setItem(STORAGE_KEY, action.payload);
        } catch {
          /* ignore */
        }
      });
  },
});

export const { setBgColor, resetBgColor } = themeSlice.actions;

export const selectBgColor = (state) => state.theme.bgColor;

export default themeSlice.reducer;
