import { createSlice } from "@reduxjs/toolkit";
import { showErrorPopup } from "../utils/notificationCenter";
import { parseColor, getContrastRatio, getContrastingColor } from "../utils/colorUtils";

const STYLES_KEY = "astromart_editable_styles_v1";

const loadStyles = () => {
  try {
    return JSON.parse(localStorage.getItem(STYLES_KEY)) || {};
  } catch {
    return {};
  }
};

const saveStyles = (styles) => {
  try {
    localStorage.setItem(STYLES_KEY, JSON.stringify(styles));
  } catch {
    /* ignore */
  }
};

const editableStyleSlice = createSlice({
  name: "editableStyle",
  initialState: {
    editMode: false,
    styles: loadStyles(),
    popover: null,
    registry: {}, // Equivalent to registryRef Map
  },
  reducers: {
    toggleEditMode: (state) => {
      state.editMode = !state.editMode;
      if (!state.editMode) {
        state.popover = null;
      }
    },
    setColor: (state, action) => {
      const { key, color } = action.payload;
      if (!key) return;

      const currentStyles = state.styles[key] || {};

      state.styles[key] = {
        ...currentStyles,
        color,
      };
      saveStyles(state.styles);
    },
    setBackground: (state, action) => {
      const { key, background } = action.payload;
      if (!key) return;

      const currentStyles = state.styles[key] || {};

      state.styles[key] = {
        ...currentStyles,
        background,
      };
      saveStyles(state.styles);
    },
    resetStyle: (state, action) => {
      const key = action.payload;
      if (key && state.styles[key]) {
        delete state.styles[key];
        saveStyles(state.styles);
      }
    },
    resetAllStyles: (state) => {
      state.styles = {};
      saveStyles(state.styles);
    },
    setStyles: (state, action) => {
      state.styles = action.payload;
      saveStyles(state.styles);
    },
    registerKey: (state, action) => {
      const key = action.payload;
      if (!key) return;
      state.registry[key] = (state.registry[key] || 0) + 1;
    },
    unregisterKey: (state, action) => {
      const key = action.payload;
      if (!key) return;
      const next = (state.registry[key] || 1) - 1;
      if (next <= 0) {
        delete state.registry[key];
      } else {
        state.registry[key] = next;
      }
    },
    openPopover: (state, action) => {
      state.popover = action.payload;
    },
    closePopover: (state) => {
      state.popover = null;
    },
  },
});

export const {
  toggleEditMode,
  setColor,
  setBackground,
  resetStyle,
  resetAllStyles,
  setStyles,
  registerKey,
  unregisterKey,
  openPopover,
  closePopover,
} = editableStyleSlice.actions;

// Thunks for export/import
export const exportStyles = () => (dispatch, getState) => {
  try {
    const { styles } = getState().editableStyle;
    const blob = new Blob([JSON.stringify(styles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astrowala-theme-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn("Export failed", e);
  }
};

export const importStyles = (file) => (dispatch) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (typeof parsed === "object" && parsed !== null) {
        dispatch(setStyles(parsed));
      }
    } catch {
      showErrorPopup("The selected theme file is not valid JSON.", {
        title: "Theme import failed",
        details: "Select a valid AstroMart theme JSON file and try again.",
      });
    }
  };
  reader.readAsText(file);
};

// Selectors
export const selectEditMode = (state) => state.editableStyle.editMode;
export const selectPopover = (state) => state.editableStyle.popover;
export const selectStyle = (key) => (state) => (key ? state.editableStyle.styles[key] || {} : {});
export const selectGroupCount = (key) => (state) => (key ? state.editableStyle.registry[key] || 0 : 0);

export default editableStyleSlice.reducer;
