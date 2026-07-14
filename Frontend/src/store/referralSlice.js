import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { backendUrl, fetchWithAuth, readApiResponse } from "../config/api";

export const REWARD_PER_REFERRAL = 100;
export const NEW_USER_DISCOUNT = 150;

export const fetchReferralStats = createAsyncThunk(
  "referral/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/user/profile/referral-stats`);
      const data = await readApiResponse(res);
      if (!res.ok) {
        return rejectWithValue(data.message || "Failed to fetch referral stats");
      }
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const referralSlice = createSlice({
  name: "referral",
  initialState: {
    stats: {
      referralCode: "",
      totalReferrals: 0,
      totalWalletCreditEarned: 0,
      walletBalance: 0,
    },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferralStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReferralStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchReferralStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectMyCode = (state) => state.referral.stats?.referralCode || "";
export const selectMyReferralCount = (state) => state.referral.stats?.totalReferrals || 0;
export const selectMyWalletCredit = (state) => state.referral.stats?.totalWalletCreditEarned || 0;
export const selectWalletBalance = (state) => state.referral.stats?.walletBalance || 0;
export const selectReferralLoading = (state) => state.referral.loading;

export default referralSlice.reducer;
