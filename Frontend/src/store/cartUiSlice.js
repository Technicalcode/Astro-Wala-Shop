import { createSlice } from "@reduxjs/toolkit";

const ADD_TO_CART_FULFILLED = "cart/add/fulfilled";

const cartUiSlice = createSlice({
  name: "cartUi",
  initialState: {
    drawerOpen: false,
    lastAddedProductId: "",
  },
  reducers: {
    openCartDrawer: (state) => {
      state.drawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.drawerOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(ADD_TO_CART_FULFILLED, (state, action) => {
      if (action.meta.fromChannel || action.meta.arg?.skipCartDrawer) return;

      const product = action.meta.arg?.product || action.meta.arg || {};
      state.drawerOpen = true;
      state.lastAddedProductId = String(
        product.productId || product._id || product.id || "",
      );
    });
  },
});

export const { closeCartDrawer, openCartDrawer } = cartUiSlice.actions;
export const selectCartDrawerOpen = (state) => state.cartUi.drawerOpen;
export const selectLastAddedProductId = (state) => state.cartUi.lastAddedProductId;

export default cartUiSlice.reducer;
