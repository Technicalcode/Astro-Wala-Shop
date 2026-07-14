import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  backendUrl,
  COMMON_CLOUDINARY_IMAGE_URL,
  fetchWithAuth,
  readApiResponse,
  toAssetUrl,
} from "../config/api";

const PLACEHOLDER = COMMON_CLOUDINARY_IMAGE_URL;

const toImageUrl = (image) => toAssetUrl(image, PLACEHOLDER);

const normalizeReview = (review = {}) => ({
  id: review.id || review._id,
  productId: review.productId || review.product?._id || review.product || "",
  productName: review.productName || review.product?.name || "",
  productImage: toImageUrl(review.productImage || review.product?.image || ""),
  userId: review.userId || review.user?._id || review.user || "",
  user: review.userName || review.user || "Verified Buyer",
  rating: Number(review.rating) || 0,
  title: review.title || "Customer Review",
  comment: review.comment || review.text || "",
  text: review.comment || review.text || "",
  status: review.status || "published",
  date: review.date || review.createdAt || new Date().toISOString(),
  updatedAt: review.updatedAt || review.date || review.createdAt || new Date().toISOString(),
});

const upsertReview = (reviews, review) => {
  const index = reviews.findIndex((item) => item.id === review.id);
  if (index === -1) {
    reviews.unshift(review);
  } else {
    reviews[index] = review;
  }
};

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProduct",
  async (productId, thunkAPI) => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/review/product/${productId}`);
      const data = await readApiResponse(res);

      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to fetch reviews");
      }

      return {
        productId,
        rating: Number(data.rating) || 0,
        ratingCount: Number(data.ratingCount) || 0,
        reviews: (data.reviews || []).map(normalizeReview),
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const fetchReviewEligibility = createAsyncThunk(
  "reviews/fetchEligibility",
  async (productId, thunkAPI) => {
    try {
      const res = await fetchWithAuth(
        `${backendUrl}/api/v1/review/product/${productId}/eligibility`,
      );
      const data = await readApiResponse(res);

      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to check review eligibility");
      }

      return {
        productId,
        canReview: Boolean(data.canReview),
        hasReviewed: Boolean(data.hasReviewed),
        review: data.review && data.review.status !== "hidden" ? normalizeReview(data.review) : null,
        message: data.message || "",
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const submitProductReview = createAsyncThunk(
  "reviews/submitProduct",
  async ({ productId, rating, title, comment }, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/review/product/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, title, comment }),
      });
      const data = await readApiResponse(res);

      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to save review");
      }

      return {
        productId,
        rating: Number(data.rating) || 0,
        ratingCount: Number(data.ratingCount) || 0,
        review: normalizeReview(data.review),
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const fetchMyReviews = createAsyncThunk(
  "reviews/fetchMine",
  async (_, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/review/my-reviews`);
      const data = await readApiResponse(res);

      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to fetch reviews");
      }

      return (data.reviews || []).map(normalizeReview);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ id, rating, title, comment }, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/review/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, title, comment }),
      });
      const data = await readApiResponse(res);

      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to update review");
      }

      const review = normalizeReview(data.review);
      return {
        productId: review.productId,
        rating: Number(data.rating) || 0,
        ratingCount: Number(data.ratingCount) || 0,
        review,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async ({ id, productId }, thunkAPI) => {
    try {
      const res = await fetchWithAuth(`${backendUrl}/api/v1/review/${id}`, {
        method: "DELETE",
      });
      const data = await readApiResponse(res);

      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to delete review");
      }

      return {
        id,
        productId: data.productId || productId,
        rating: Number(data.rating) || 0,
        ratingCount: Number(data.ratingCount) || 0,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    byProduct: {},
    eligibility: {},
    myReviews: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state, action) => {
        const productId = action.meta.arg;
        state.byProduct[productId] = {
          ...(state.byProduct[productId] || {}),
          loading: true,
          error: null,
        };
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.byProduct[action.payload.productId] = {
          reviews: action.payload.reviews,
          rating: action.payload.rating,
          ratingCount: action.payload.ratingCount,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        const productId = action.meta.arg;
        state.byProduct[productId] = {
          ...(state.byProduct[productId] || {}),
          loading: false,
          error: action.payload,
        };
      })
      .addCase(fetchReviewEligibility.fulfilled, (state, action) => {
        state.eligibility[action.payload.productId] = action.payload;
      })
      .addCase(submitProductReview.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(submitProductReview.fulfilled, (state, action) => {
        const { productId, review, rating, ratingCount } = action.payload;
        const productReviews = state.byProduct[productId]?.reviews || [];

        upsertReview(productReviews, review);

        state.byProduct[productId] = {
          reviews: productReviews,
          rating,
          ratingCount,
          loading: false,
          error: null,
        };
        state.eligibility[productId] = {
          canReview: true,
          hasReviewed: true,
          review,
          message: "You can review this product",
        };
        upsertReview(state.myReviews, review);
        state.saving = false;
      })
      .addCase(submitProductReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(fetchMyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.myReviews = action.payload;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateReview.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const { productId, review, rating, ratingCount } = action.payload;
        const productReviews = state.byProduct[productId]?.reviews || [];

        upsertReview(productReviews, review);
        upsertReview(state.myReviews, review);

        state.byProduct[productId] = {
          ...(state.byProduct[productId] || {}),
          reviews: productReviews,
          rating,
          ratingCount,
        };
        state.eligibility[productId] = {
          ...(state.eligibility[productId] || {}),
          canReview: true,
          hasReviewed: true,
          review,
        };
        state.saving = false;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        const { id, productId, rating, ratingCount } = action.payload;

        state.myReviews = state.myReviews.filter((review) => review.id !== id);

        if (state.byProduct[productId]) {
          state.byProduct[productId].reviews = state.byProduct[productId].reviews.filter(
            (review) => review.id !== id,
          );
          state.byProduct[productId].rating = rating;
          state.byProduct[productId].ratingCount = ratingCount;
        }

        if (state.eligibility[productId]?.review?.id === id) {
          state.eligibility[productId] = {
            ...state.eligibility[productId],
            hasReviewed: false,
            review: null,
          };
        }
      });
  },
});

export const selectProductReviewState = (productId) => (state) =>
  state.reviews.byProduct[productId] || {
    reviews: [],
    rating: 0,
    ratingCount: 0,
    loading: false,
    error: null,
  };

export const selectReviewEligibility = (productId) => (state) =>
  state.reviews.eligibility[productId] || {
    canReview: false,
    hasReviewed: false,
    review: null,
    message: "",
  };

export const selectMyReviews = (state) => state.reviews.myReviews;
export const selectReviewsLoading = (state) => state.reviews.loading;
export const selectReviewSaving = (state) => state.reviews.saving;
export const selectReviewsError = (state) => state.reviews.error;

export default reviewSlice.reducer;
