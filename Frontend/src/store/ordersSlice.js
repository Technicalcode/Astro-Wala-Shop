import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  backendUrl,
  fetchWithAuth as fetchWithAuthRequest,
  readApiResponse,
  toAssetUrl,
} from "../config/api";

const ADMIN_PURCHASE_ROLES = ["admin", "superAdmin", "orderManager"];
const ADMIN_PURCHASE_MESSAGE =
  "Admin accounts cannot add products to cart or place orders. Please use a customer account.";

const normalizeOrder = (order) => {
  const address = order.shippingAddress || order.address || {};

  return {
    id: order._id || order.id,
    items: (order.items || []).map((item) => ({
      id: item.product?._id || item.product || item.id,
      name: item.name || item.product?.name || "",
      image: toAssetUrl(item.image || item.product?.image || ""),
      price: Number(item.price) || 0,
      qty: Number(item.quantity || item.qty) || 1,
    })),
    address: {
      name: address.fullName || address.name || "",
      phone: address.phone || "",
      line: address.address || address.line || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    },
    paymentMethod: String(order.paymentMethod || "cod").toLowerCase(),
    paymentStatus: order.paymentStatus || "Pending",
    total: Number(order.totalAmount || order.total) || 0,
    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,
    coupon: order.coupon || null,
    userEmail: order.user?.email || order.userEmail || "",
    status: order.orderStatus || order.status || "Confirmed",
    placedAt: order.createdAt || order.placedAt || new Date().toISOString(),
  };
};

export const createOrder = createAsyncThunk(
  "orders/create",
  async (orderData, thunkAPI) => {
    try {
      const user = thunkAPI.getState().auth.user;
      if (ADMIN_PURCHASE_ROLES.includes(user?.role)) {
        return thunkAPI.rejectWithValue(ADMIN_PURCHASE_MESSAGE);
      }

      const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await readApiResponse(res);
      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to place order");
      }

      return normalizeOrder(data.order);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMine",
  async (_, thunkAPI) => {
    try {
      const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/order/my-orders`);

      const data = await readApiResponse(res);
      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to fetch orders");
      }

      return (data.orders || []).map(normalizeOrder);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOne",
  async (orderId, thunkAPI) => {
    try {
      const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/order/${orderId}`);
      const data = await readApiResponse(res);
      if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to fetch order");
      return normalizeOrder(data.order);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const cancelOrder = createAsyncThunk(
  "orders/cancel",
  async (orderId, thunkAPI) => {
    try {
      const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/order/${orderId}/cancel`, {
        method: "PATCH",
      });
      const data = await readApiResponse(res);
      if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to cancel order");
      return normalizeOrder(data.order);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const fetchAllOrders = createAsyncThunk(
  "orders/fetchAll",
  async (_, thunkAPI) => {
    try {
      const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/order/all`);

      const data = await readApiResponse(res);
      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to fetch orders");
      }

      return (data.orders || []).map(normalizeOrder);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, status }, thunkAPI) => {
    try {
      const res = await fetchWithAuthRequest(`${backendUrl}/api/v1/order/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderStatus: status }),
      });

      const data = await readApiResponse(res);
      if (!res.ok) {
        return thunkAPI.rejectWithValue(data.message || "Failed to update order");
      }

      return normalizeOrder(data.order);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  },
);

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    loading: false,
    error: null,
  },
	reducers: {
		placeOrder: (state, action) => {
			state.orders.unshift(action.payload);
		},
		addApiOrder: (state, action) => {
			state.orders.unshift(normalizeOrder(action.payload));
		},
	},
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index === -1) state.orders.unshift(action.payload);
        else state.orders[index] = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) state.orders[index] = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) state.orders[index] = action.payload;
      });
  },
});

export const { placeOrder, addApiOrder } = ordersSlice.actions;

export const selectAllOrders = (state) => state.orders.orders;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrdersError = (state) => state.orders.error;
export const selectOrdersForUser = (email) => (state) =>
  state.orders.orders.filter((order) => !email || !order.userEmail || order.userEmail === email);

export default ordersSlice.reducer;
