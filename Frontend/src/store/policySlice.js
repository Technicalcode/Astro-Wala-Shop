import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { backendUrl, fetchWithAuth, readApiResponse } from "../config/api";

const normalizeSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const defaultPolicyStyles = {
  title: {
    fontFamily: "default",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    textColor: "#374151",
  },
  heading: {
    fontFamily: "default",
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "normal",
    textColor: "#111827",
  },
  body: {
    fontFamily: "default",
    fontSize: 14,
    fontWeight: "normal",
    fontStyle: "normal",
    textColor: "#4B5563",
  },
};

const normalizeFontBlock = (block = {}, fallback = defaultPolicyStyles.body) => ({
  fontFamily: block.fontFamily || fallback.fontFamily,
  fontSize: Number(block.fontSize) || fallback.fontSize,
  fontWeight: block.fontWeight || fallback.fontWeight,
  fontStyle: block.fontStyle || fallback.fontStyle,
  textColor: block.textColor || fallback.textColor,
});

const normalizePolicyStyles = (styles = {}) => {
  if (styles.fontFamily || styles.headingSize || styles.bodySize) {
    return {
      title: normalizeFontBlock(
        {
          fontFamily: styles.fontFamily,
          fontSize: 12,
          fontWeight: styles.fontWeight,
          fontStyle: styles.fontStyle,
          textColor: "#374151",
        },
        defaultPolicyStyles.title,
      ),
      heading: normalizeFontBlock(
        {
          fontFamily: styles.fontFamily,
          fontSize: styles.headingSize,
          fontWeight: "bold",
          fontStyle: styles.fontStyle,
          textColor: "#111827",
        },
        defaultPolicyStyles.heading,
      ),
      body: normalizeFontBlock(
        {
          fontFamily: styles.fontFamily,
          fontSize: styles.bodySize,
          fontWeight: styles.fontWeight,
          fontStyle: styles.fontStyle,
          textColor: styles.textColor,
        },
        defaultPolicyStyles.body,
      ),
    };
  }

  return {
    title: normalizeFontBlock(styles.title, defaultPolicyStyles.title),
    heading: normalizeFontBlock(styles.heading, defaultPolicyStyles.heading),
    body: normalizeFontBlock(styles.body, defaultPolicyStyles.body),
  };
};

const normalizePolicy = (policy = {}) => ({
  id: policy.id || policy._id || policy.slug,
  _id: policy._id || policy.id || "",
  slug: normalizeSlug(policy.slug),
  title: policy.title || "",
  heading: policy.heading || "",
  content: policy.content || "",
  styles: normalizePolicyStyles(policy.styles),
  position: Number(policy.position) || 0,
  adminId: policy.adminId || "",
  lastEditedByAdminId: policy.lastEditedByAdminId || "",
  createdAt: policy.createdAt || "",
  updatedAt: policy.updatedAt || "",
});

const buildPolicyPayload = (policy = {}) => ({
  title: policy.title?.trim(),
  slug: normalizeSlug(policy.slug),
  heading: policy.heading?.trim(),
  content: policy.content,
  styles: normalizePolicyStyles(policy.styles),
  position: Number(policy.position) || 0,
});

export const fetchPolicies = createAsyncThunk("policies/fetchAll", async (_, thunkAPI) => {
  try {
    const res = await fetch(`${backendUrl}/api/v1/policy/all-policies`);
    const data = await readApiResponse(res);

    if (!res.ok) {
      return thunkAPI.rejectWithValue(data.message || "Failed to fetch policies");
    }

    return (data.data || []).map(normalizePolicy);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch policies");
  }
});

export const addPolicy = createAsyncThunk("policies/create", async (policy, thunkAPI) => {
  try {
    const res = await fetchWithAuth(`${backendUrl}/api/v1/policy/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPolicyPayload(policy)),
    });
    const data = await readApiResponse(res);

    if (!res.ok) {
      return thunkAPI.rejectWithValue(data.message || "Failed to create policy");
    }

    return normalizePolicy(data.data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to create policy");
  }
});

export const updatePolicy = createAsyncThunk("policies/update", async (policy, thunkAPI) => {
  try {
    const id = policy.id || policy._id;
    const res = await fetchWithAuth(`${backendUrl}/api/v1/policy/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPolicyPayload(policy)),
    });
    const data = await readApiResponse(res);

    if (!res.ok) {
      return thunkAPI.rejectWithValue(data.message || "Failed to update policy");
    }

    return normalizePolicy(data.data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to update policy");
  }
});

export const deletePolicy = createAsyncThunk("policies/delete", async (id, thunkAPI) => {
  try {
    const res = await fetchWithAuth(`${backendUrl}/api/v1/policy/delete/${id}`, {
      method: "DELETE",
    });
    const data = await readApiResponse(res);

    if (!res.ok) {
      return thunkAPI.rejectWithValue(data.message || "Failed to delete policy");
    }

    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to delete policy");
  }
});

const policySlice = createSlice({
  name: "policies",
  initialState: {
    policies: [],
    loading: false,
    loaded: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.policies = action.payload;
      })
      .addCase(fetchPolicies.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload;
      })
      .addCase(addPolicy.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addPolicy.fulfilled, (state, action) => {
        state.saving = false;
        state.policies.push(action.payload);
      })
      .addCase(addPolicy.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updatePolicy.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePolicy.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.policies.findIndex((policy) => policy.id === action.payload.id);
        if (index === -1) {
          state.policies.push(action.payload);
        } else {
          state.policies[index] = action.payload;
        }
      })
      .addCase(updatePolicy.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(deletePolicy.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deletePolicy.fulfilled, (state, action) => {
        state.saving = false;
        state.policies = state.policies.filter((policy) => policy.id !== action.payload);
      })
      .addCase(deletePolicy.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const selectAllPolicies = (state) => state.policies.policies;
export const selectPolicyBySlug = (slug) => (state) =>
  state.policies.policies.find((policy) => policy.slug === normalizeSlug(slug));
export const selectPoliciesLoading = (state) => state.policies.loading;
export const selectPoliciesLoaded = (state) => state.policies.loaded;
export const selectPoliciesSaving = (state) => state.policies.saving;
export const selectPoliciesError = (state) => state.policies.error;

export default policySlice.reducer;
