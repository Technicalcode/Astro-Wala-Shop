import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { backendUrl, fetchWithAuth, readApiResponse, trackedFetch } from "../config/api";

const defaultFont = {
  fontFamily: "default",
  fontSize: 14,
  fontWeight: "normal",
  fontStyle: "normal",
  textColor: "#4B5563",
};

const normalizeFont = (font = {}, fallback = defaultFont) => ({
  fontFamily: font.fontFamily || fallback.fontFamily,
  fontSize: Number(font.fontSize) || fallback.fontSize,
  fontWeight: font.fontWeight || fallback.fontWeight,
  fontStyle: font.fontStyle || fallback.fontStyle,
  textColor: font.textColor || fallback.textColor,
});

const normalizeTextBlock = (block = {}, fallback = {}) => ({
  text: block.text ?? fallback.text ?? "",
  enabled: block.enabled !== false,
  font: normalizeFont(block.font, fallback.font || defaultFont),
});

const normalizeSection = (section = {}, fallback = {}) => ({
  heading: section.heading ?? fallback.heading ?? "",
  body: section.body ?? fallback.body ?? "",
  enabled: section.enabled !== false,
  headingFont: normalizeFont(
    section.headingFont,
    fallback.headingFont || { ...defaultFont, fontSize: 24, fontWeight: "bold", textColor: "#111827" },
  ),
  bodyFont: normalizeFont(section.bodyFont, fallback.bodyFont || defaultFont),
});

const normalizeButton = (button = {}, fallback = {}) => ({
  text: button.text ?? fallback.text ?? "",
  link: button.link ?? fallback.link ?? "/",
  enabled: button.enabled !== false,
  font: normalizeFont(button.font, fallback.font || { ...defaultFont, fontWeight: "bold", textColor: "#111827" }),
});

const normalizeImage = (image = {}, fallback = {}) => ({
  url: image.url ?? fallback.url ?? "/Gemini_Generated_Image_89fz9b89fz9b89fz.webp",
  enabled: image.enabled !== false,
});

export const defaultAboutPage = {
  heroImage: { url: "/Gemini_Generated_Image_89fz9b89fz9b89fz.webp", enabled: true },
  secondaryImage: { url: "/Gemini_Generated_Image_89fz9b89fz9b89fz.webp", enabled: true },
  title: {
    text: "About Astro Wala Shop",
    enabled: true,
    font: { ...defaultFont, fontSize: 34, fontWeight: "bold", textColor: "#FFFFFF" },
  },
  intro: {
    text: "Astro Wala Shop is India's trusted destination for certified astrology products, spiritual essentials, and reliable customer support.",
    enabled: true,
    font: { ...defaultFont, fontSize: 16, textColor: "#EFF6FF" },
  },
  primaryButton: {
    text: "Explore Products",
    link: "/products",
    enabled: true,
    font: { ...defaultFont, fontWeight: "bold", textColor: "#111827" },
  },
  secondaryButton: {
    text: "Contact Support",
    link: "/contact",
    enabled: true,
    font: { ...defaultFont, fontWeight: "bold", textColor: "#FFFFFF" },
  },
  sections: [
    {
      heading: "Who we are",
      body: "Astro Wala Shop brings together certified gemstones, authentic rudraksha, energised yantras, pooja essentials, healing crystals, and astrology guidance on one trusted platform. Our goal is to make spiritual shopping simple, transparent, and dependable for every customer.",
      enabled: true,
    },
    {
      heading: "What we promise",
      body: "We focus on clear product details, honest pricing, careful packaging, and responsive support. Wherever certification or verification is required, we make sure the customer receives the right information before making a purchase decision.",
      enabled: true,
    },
  ],
  processSteps: [
    { heading: "Choose the right category", body: "Explore gemstones, rudraksha, yantras, puja essentials, healing crystals, and astrology items with clear product details.", enabled: true },
    { heading: "Check trust details", body: "Review price, size, delivery availability, return eligibility, certification notes, and product highlights before checkout.", enabled: true },
    { heading: "Order with support", body: "After checkout, order status, invoice, returns, refunds, and customer support are available from the account area.", enabled: true },
  ],
  qualityPoints: [
    { text: "Product information is kept easy to read and transparent.", enabled: true },
    { text: "Important buying details are shown before checkout.", enabled: true },
    { text: "Orders are packed carefully for safe delivery.", enabled: true },
    { text: "Support is available for order, product, return, and refund questions.", enabled: true },
  ],
};

export const normalizeAboutPage = (page = {}) => ({
  ...defaultAboutPage,
  ...page,
  heroImage: normalizeImage(page.heroImage, defaultAboutPage.heroImage),
  secondaryImage: normalizeImage(page.secondaryImage, defaultAboutPage.secondaryImage),
  title: normalizeTextBlock(page.title, defaultAboutPage.title),
  intro: normalizeTextBlock(page.intro, defaultAboutPage.intro),
  primaryButton: normalizeButton(page.primaryButton, defaultAboutPage.primaryButton),
  secondaryButton: normalizeButton(page.secondaryButton, defaultAboutPage.secondaryButton),
  sections: (page.sections?.length ? page.sections : defaultAboutPage.sections).map((section, index) =>
    normalizeSection(section, defaultAboutPage.sections[index]),
  ),
  processSteps: (page.processSteps?.length ? page.processSteps : defaultAboutPage.processSteps).map((section, index) =>
    normalizeSection(section, defaultAboutPage.processSteps[index]),
  ),
  qualityPoints: (page.qualityPoints?.length ? page.qualityPoints : defaultAboutPage.qualityPoints).map((point, index) =>
    normalizeTextBlock(point, defaultAboutPage.qualityPoints[index]),
  ),
});

export const fetchAboutPage = createAsyncThunk("aboutPage/fetch", async (_, thunkAPI) => {
  try {
    const res = await trackedFetch(`${backendUrl}/api/v1/about-page`);
    const data = await readApiResponse(res);
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to fetch About page");
    return normalizeAboutPage(data.data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to fetch About page");
  }
});

export const saveAboutPage = createAsyncThunk("aboutPage/save", async (page, thunkAPI) => {
  try {
    const res = await fetchWithAuth(`${backendUrl}/api/v1/about-page`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeAboutPage(page)),
    });
    const data = await readApiResponse(res);
    if (!res.ok) return thunkAPI.rejectWithValue(data.message || "Failed to save About page");
    return normalizeAboutPage(data.data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || "Failed to save About page");
  }
});

const aboutPageSlice = createSlice({
  name: "aboutPage",
  initialState: {
    page: defaultAboutPage,
    loading: false,
    loaded: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAboutPage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAboutPage.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.page = action.payload;
      })
      .addCase(fetchAboutPage.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload;
      })
      .addCase(saveAboutPage.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveAboutPage.fulfilled, (state, action) => {
        state.saving = false;
        state.page = action.payload;
      })
      .addCase(saveAboutPage.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const selectAboutPage = (state) => state.aboutPage.page;
export const selectAboutPageSaving = (state) => state.aboutPage.saving;

export default aboutPageSlice.reducer;
