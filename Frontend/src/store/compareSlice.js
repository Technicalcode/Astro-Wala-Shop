import { createSlice } from "@reduxjs/toolkit";

const MAX_COMPARE = 3;

const compareSlice = createSlice({
  name: "compare",
  initialState: {
    compareList: [],
  },
  reducers: {
    toggleCompare: (state, action) => {
      const product = action.payload;
      const existsIndex = state.compareList.findIndex((p) => p.id === product.id);
      
      if (existsIndex !== -1) {
        state.compareList.splice(existsIndex, 1);
      } else {
        if (state.compareList.length < MAX_COMPARE) {
          state.compareList.push(product);
        }
      }
    },
    clearCompare: (state) => {
      state.compareList = [];
    }
  }
});

export const { toggleCompare, clearCompare } = compareSlice.actions;

export const selectCompareList = (state) => state.compare.compareList;
export const selectCanAddMoreCompare = (state) => state.compare.compareList.length < MAX_COMPARE;

export default compareSlice.reducer;
