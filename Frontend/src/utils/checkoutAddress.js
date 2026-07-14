import {
  backendUrl,
  fetchWithAuth,
  getAuthHeader,
  hasAuthCredentials,
  normalizeToken,
  readApiResponse,
} from "../config/api";

const USERS_KEY = "astromart_users";

export const CHECKOUT_ADDRESS_WARNING = "Please fill in all details to buy the product";

export const emptyDeliveryAddress = {
  name: "",
  phone: "",
  pincode: "",
  line: "",
  city: "",
  state: "",
};

export { getAuthHeader, normalizeToken };

export const isCompleteAddress = (address = {}) =>
  Boolean(
    address.name?.trim() &&
      /^[6-9]\d{9}$/.test(address.phone || "") &&
      address.line?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      /^[1-9]\d{5}$/.test(address.pincode || ""),
  );

export const splitFullName = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

  return {
    firstName,
    lastName,
    fullName: parts.join(" "),
  };
};

export const normalizeSavedAddress = (savedAddress = {}) => {
  const source = savedAddress || {};

  return {
    name: source.name || source.fullName || "",
    phone: source.phone || source.phoneNumber || "",
    line: source.line || source.address || source.addressLine1 || "",
    city: source.city || "",
    state: source.state || "",
    pincode: source.pincode || "",
    isFilled: source.isFilled === true,
  };
};

export const normalizeProfileAddress = (profile) => {
  if (!profile) return null;

  const address = profile.address || {};
  const addressLine = [address.addressLine1, address.addressLine2]
    .filter(Boolean)
    .join(", ");
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return {
    name: profile.name || profile.fullName || name,
    phone: profile.phone || profile.phoneNumber || "",
    line: address.line || address.address || addressLine || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",
    isFilled: profile.isFilled === true,
  };
};

const getLocalSavedAddress = (user) => {
  if (!user?.email) return null;

  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const fullUser = users.find((entry) => entry.email === user.email);
    return fullUser?.addresses?.find((addr) => addr.isDefault) || fullUser?.addresses?.[0] || null;
  } catch {
    return null;
  }
};

export const getCheckoutAddressDecision = async (user) => {
  const emptyAddress = { ...emptyDeliveryAddress };
  if (!user) return { isFilled: false, address: emptyAddress };

  const localAddress = normalizeSavedAddress(getLocalSavedAddress(user));
  if (localAddress.isFilled === true || isCompleteAddress(localAddress)) {
    return { isFilled: true, address: { ...emptyAddress, ...localAddress } };
  }

  if (!hasAuthCredentials()) return { isFilled: false, address: emptyAddress };

  try {
    const res = await fetchWithAuth(`${backendUrl}/api/v1/user/profile/get-profile`);
    if (!res.ok) return { isFilled: false, address: emptyAddress };

    const data = await readApiResponse(res);
    const profileAddress = normalizeProfileAddress(data.data);

    if (profileAddress?.isFilled === true || isCompleteAddress(profileAddress)) {
      return { isFilled: true, address: { ...emptyAddress, ...profileAddress } };
    }
  } catch (err) {
    console.error("Could not check delivery profile", err);
  }

  return { isFilled: false, address: emptyAddress };
};

export const getCheckoutNavigationState = async (user) => {
  const decision = await getCheckoutAddressDecision(user);

  if (!decision.isFilled) {
    return {
      deliveryAddressMode: "empty",
      deliveryAddress: { ...emptyDeliveryAddress },
      addressWarning: CHECKOUT_ADDRESS_WARNING,
    };
  }

  return {
    deliveryAddressMode: "prefill",
    deliveryAddress: decision.address,
  };
};

export const saveDeliveryProfile = async (address, extra = {}) => {
  if (!hasAuthCredentials()) throw new Error("Please login again to save delivery details.");

  const { firstName, lastName, fullName } = splitFullName(address.name);
  const payload = {
    fullName,
    firstName,
    lastName,
    phoneNumber: address.phone,
    addressLine1: address.line,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: "India",
  };

  if (extra.gender) payload.gender = extra.gender;
  if (extra.bio !== undefined) payload.bio = extra.bio;

  const res = await fetchWithAuth(`${backendUrl}/api/v1/user/profile/update-profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readApiResponse(res);
  if (!res.ok) {
    throw new Error(data.message || "Failed to save delivery details");
  }

  return data.data;
};
