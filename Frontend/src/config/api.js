import { withNetworkActivity } from "../utils/networkActivity";
import { showErrorPopup } from "../utils/notificationCenter";

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const COMMON_CLOUDINARY_IMAGE_URL =
  "https://res.cloudinary.com/dbi2izwfz/image/upload/v1783702104/astro-categories/deee84e421bc603a693426a67ad795dc.webp";

export const DEFAULT_BANNER_CLOUDINARY_URL =
  "https://res.cloudinary.com/dbi2izwfz/image/upload/v1783709577/astro-banners/homepage-default-banner-1783709055493.webp";

const BROKEN_SEEDED_PRODUCT_IMAGE =
  /\/image\/upload\/v1783510130\/products\//i;

export const toAssetUrl = (image, fallback = COMMON_CLOUDINARY_IMAGE_URL) => {
  const value = String(image || "").trim();
  if (!value) return fallback;
  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (BROKEN_SEEDED_PRODUCT_IMAGE.test(value)) return fallback;
  return /^https:\/\/res\.cloudinary\.com\//i.test(value) ? value : fallback;
};

export const normalizeToken = (value) => {
  if (typeof value !== "string") return "";

  let token = value.replace(/['"]+/g, "").trim();
  if (token.toLowerCase().startsWith("bearer ")) token = token.slice(7).trim();

  if (!token || token === "[object Object]" || token === "undefined" || token === "null") {
    return "";
  }

  return token;
};

export const getStoredAccessToken = () => {
  const token = normalizeToken(localStorage.getItem("astromart_token") || "");
  if (!token) localStorage.removeItem("astromart_token");
  return token;
};

export const getStoredRefreshToken = () =>
  normalizeToken(localStorage.getItem("astromart_refresh_token") || "");

export const hasAuthCredentials = () =>
  Boolean(getStoredAccessToken() || getStoredRefreshToken());

export const getAuthHeader = () => {
  const token = getStoredAccessToken();
  return token ? `Bearer ${token}` : "";
};

export const readApiResponse = async (res) => {
  const text = await res.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const requestPath = (() => {
      try {
        const url = new URL(res.url);
        return `${url.pathname}${url.search}`;
      } catch {
        return "API request";
      }
    })();
    const responseDetails = data.details && typeof data.details === "object"
      ? Object.entries(data.details)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      : "";
    showErrorPopup(data.message || `Request failed with status ${res.status}`, {
      status: res.status,
      details: [`Request: ${requestPath}`, data.code ? `Code: ${data.code}` : "", responseDetails]
        .filter(Boolean)
        .join("\n"),
    });
  }

  return data;
};

const reportNetworkFailure = (error, request) => {
  showErrorPopup(error, {
    title: "Connection problem",
    details: `Could not reach: ${String(request || "server").replace(backendUrl, "")}`,
  });
};

export const trackedFetch = (...args) =>
  withNetworkActivity(async () => {
    try {
      return await fetch(...args);
    } catch (error) {
      reportNetworkFailure(error, args[0]);
      throw error;
    }
  });

const getTokensFromResponse = (data = {}) => {
  const tokenPayload = data.token;

  return {
    accessToken: normalizeToken(
      typeof tokenPayload === "string"
        ? tokenPayload
        : tokenPayload?.accessToken || data.accessToken || data.data?.accessToken || "",
    ),
    refreshToken: normalizeToken(
      (typeof tokenPayload === "object" && tokenPayload?.refreshToken) ||
        data.refreshToken ||
        data.data?.refreshToken ||
        "",
    ),
  };
};

export const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await fetch(`${backendUrl}/api/v1/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await readApiResponse(res);

  if (!res.ok) {
    throw new Error(data.message || "Failed to refresh token");
  }

  const tokens = getTokensFromResponse(data);
  if (!tokens.accessToken) {
    throw new Error("No access token in refresh response");
  }

  localStorage.setItem("astromart_token", tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem("astromart_refresh_token", tokens.refreshToken);
  }

  return tokens.accessToken;
};

export const clearAuthSession = () => {
  localStorage.removeItem("astromart_token");
  localStorage.removeItem("astromart_refresh_token");
  localStorage.removeItem("astromart_session");
};

export const fetchWithAuth = (url, options = {}) =>
  withNetworkActivity(async () => {
    const buildOptions = () => ({
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: getAuthHeader(),
      },
    });

    let res;
    try {
      res = await fetch(url, buildOptions());
    } catch (error) {
      reportNetworkFailure(error, url);
      throw error;
    }

    if (res.status !== 401 || !hasAuthCredentials()) {
      return res;
    }

    try {
      await refreshAccessToken();
    } catch {
      clearAuthSession();
      return res;
    }

    try {
      return await fetch(url, buildOptions());
    } catch (error) {
      reportNetworkFailure(error, url);
      throw error;
    }
  });

export const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));
