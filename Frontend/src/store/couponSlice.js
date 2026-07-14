import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchWithAuth, backendUrl, readApiResponse } from "../config/api";

export const fetchAvailableCoupons = createAsyncThunk(
  "coupon/fetchAvailable",
  async (_, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/coupon/active`);
      const data = await readApiResponse(res);
      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to fetch coupons");
      }
      return data.data; // The array of available coupons
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const couponSlice = createSlice({
  name: "coupon",
  initialState: {
    availableCoupons: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.availableCoupons = action.payload;
      })
      .addCase(fetchAvailableCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectAvailableCoupons = (state) => state.coupon.availableCoupons;
export const selectCouponLoading = (state) => state.coupon.loading;

export default couponSlice.reducer;
