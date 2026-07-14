import { createSlice } from "@reduxjs/toolkit";
import {
	backendUrl,
	fetchWithAuth,
	hasAuthCredentials,
	readApiResponse,
	trackedFetch,
} from "../config/api";
import { resetCartSession } from "./cartSlice";

const USERS_KEY = "astromart_users";
const SESSION_KEY = "astromart_session";
const LOGIN_ACTIVITY_KEY = "astromart_login_activity";

const loadUsers = () => {
	try {
		return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
	} catch {
		return [];
	}
};

const saveUsers = (users) => {
	localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const isEmailLike = (value) => cleanText(value).includes("@");

const getProfileName = (profile = {}) =>
	cleanText(
		profile.fullName ||
			profile.name ||
			[profile.firstName, profile.middleName, profile.lastName]
				.filter(Boolean)
				.join(" ")
	);

export const getUserSavedName = (user = {}) => {
	const name = cleanText(user.name || user.fullName);
	const email = cleanText(user.email);

	if (!name) return "";
	if (email && name.toLowerCase() === email.toLowerCase()) return "";
	if (isEmailLike(name)) return "";

	return name;
};

export const getUserDisplayName = (user = {}) =>
	getUserSavedName(user) || cleanText(user.email) || "User";

export const getUserFirstName = (user = {}) => {
	const displayName = getUserDisplayName(user);
	if (isEmailLike(displayName)) return displayName;
	return displayName.split(/\s+/)[0] || displayName;
};

const getInitialUser = () => {
	try {
		return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
	} catch {
		return null;
	}
};

const authSlice = createSlice({
	name: "auth",
	initialState: {
		user: getInitialUser(),
	},
	reducers: {
		setUser: (state, action) => {
			state.user = action.payload;
		},
		logoutUser: (state) => {
			state.user = null;
			localStorage.removeItem(SESSION_KEY);
			localStorage.removeItem("astromart_token");
			localStorage.removeItem("astromart_refresh_token");
		},
	},
});

export const { setUser, logoutUser } = authSlice.actions;

// Thunks for real API integration
export const login =
	({ email, password }) =>
	async (dispatch) => {
		try {
			const res = await trackedFetch(`${backendUrl}/api/v1/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ Email: email, Password: password }),
			});
			const data = await res.json();

			if (!res.ok) {
				return {
					ok: false,
					error: data.message || "Invalid email or password.",
				};
			}

			const userEmail = data.user?.email || email;
			const displayName =
				getProfileName(data.user) || data.user?.name || data.user?.fullName || "";

			const session = {
				id: data.user?.id || "u-new",
				name: cleanText(displayName) || userEmail,
				fullName: cleanText(displayName),
				email: userEmail,
				role: data.user?.role || "customer",
			};

			localStorage.setItem(SESSION_KEY, JSON.stringify(session));
			if (data.loginActivityId) {
				localStorage.setItem(LOGIN_ACTIVITY_KEY, data.loginActivityId);
			} else {
				localStorage.removeItem(LOGIN_ACTIVITY_KEY);
			}

			if (data.token) {
				if (typeof data.token === "object" && data.token.accessToken) {
					localStorage.setItem("astromart_token", data.token.accessToken);
					if (data.token.refreshToken) {
						localStorage.setItem(
							"astromart_refresh_token",
							data.token.refreshToken
						);
					}
				} else if (typeof data.token === "string") {
					localStorage.setItem("astromart_token", data.token);
				}
			}

			dispatch(setUser(session));
			return { ok: true, user: session };
		} catch (err) {
			return { ok: false, error: err.message || "Could not connect to the server." };
		}
	};

export const signup =
	({ email, password, referralCode }) =>
	async () => {
		try {
			// Using the correct backend endpoint
			const res = await trackedFetch(`${backendUrl}/api/v1/auth/create`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ Email: email, Password: password, referralCode }),
			});

			const data = await res.json();

			if (!res.ok) {
				return {
					ok: false,
					error: data.message || "An account with this email already exists.",
				};
			}

			// Some backends return the user object directly, handle login automatically if so
			return { ok: true };
		} catch (err) {
			return { ok: false, error: err.message || "Could not connect to the server." };
		}
	};

export const forgetPassword =
	({ email }) =>
	async () => {
		try {
			const res = await trackedFetch(`${backendUrl}/api/v1/auth/forgot-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (!res.ok)
				return {
					ok: false,
					error: data.message || "Failed to send reset link.",
				};
			return { ok: true, message: data.message };
		} catch (err) {
			return { ok: false, error: err.message || "Server connection failed." };
		}
	};

export const resetPassword =
	({ token, newPassword }) =>
	async () => {
		try {
			const res = await trackedFetch(`${backendUrl}/api/v1/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ resetToken: token, password: newPassword }),
			});
			const data = await res.json();
			if (!res.ok)
				return {
					ok: false,
					error: data.message || "Failed to reset password.",
				};
			return { ok: true };
		} catch (err) {
			return { ok: false, error: err.message || "Server connection failed." };
		}
	};

export const refreshAccessToken = () => async () => {
	try {
		const refreshToken = localStorage.getItem("astromart_refresh_token");

		if (!refreshToken) return { ok: false, error: "No refresh token found." };

		const res = await trackedFetch(`${backendUrl}/api/v1/auth/refresh-token`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken }),
		});

		const data = await res.json();

		if (
			res.ok &&
			(data.success || data.sucess || data.token || data.accessToken)
		) {
			let newAccessToken = null;
			let newRefreshToken = null;

			if (data.token) {
				if (typeof data.token === "object") {
					newAccessToken = data.token.accessToken;
					newRefreshToken = data.token.refreshToken;
				} else {
					newAccessToken = data.token;
				}
			} else if (data.data?.accessToken) {
				newAccessToken = data.data.accessToken;
				newRefreshToken = data.data.refreshToken;
			} else if (data.accessToken) {
				newAccessToken = data.accessToken;
				newRefreshToken = data.refreshToken;
			}

			if (newAccessToken)
				localStorage.setItem("astromart_token", newAccessToken);
			if (newRefreshToken)
				localStorage.setItem("astromart_refresh_token", newRefreshToken);

			return { ok: true, token: newAccessToken };
		}
		return { ok: false, error: data.message || "Invalid refresh token." };
	} catch {
		return { ok: false, error: "Network error during token refresh." };
	}
};

export const logout = () => (dispatch) => {
	const accessToken = localStorage.getItem("astromart_token");
	const loginActivityId = localStorage.getItem(LOGIN_ACTIVITY_KEY);

	if (accessToken && loginActivityId) {
		trackedFetch(`${backendUrl}/api/v1/auth/logout`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({ loginActivityId }),
		}).catch(() => {});
	}

	localStorage.removeItem(LOGIN_ACTIVITY_KEY);
	dispatch(logoutUser());
	dispatch(resetCartSession());
};

export const syncUserProfile = () => async (dispatch, getState) => {
	const user = getState().auth.user;
	if (!user?.email || !hasAuthCredentials()) return { ok: false };

	try {
		const res = await fetchWithAuth(`${backendUrl}/api/v1/user/profile/get-profile`);
		const data = await readApiResponse(res);

		if (!res.ok) {
			return { ok: false, error: data.message || "Could not fetch profile" };
		}

		const profile = data.data || null;
		const profileName = getProfileName(profile);
		const existingName = getUserSavedName(user);
		const nextName = profileName || existingName || user.email;
		const nextUser = {
			...user,
			name: nextName,
			fullName: profileName || existingName || "",
			profile,
		};

		if (
			user.name === nextUser.name &&
			user.fullName === nextUser.fullName &&
			user.profile === nextUser.profile
		) {
			return { ok: true, user };
		}

		localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
		dispatch(setUser(nextUser));
		return { ok: true, user: nextUser };
	} catch (err) {
		return { ok: false, error: err.message };
	}
};

// New thunk to fetch full user details
export const getFullUser = (email) => {
	const users = loadUsers();
	return users.find((u) => u.email === email) || null;
};

// New thunk to update user details
export const updateUser = (email, updates) => (dispatch) => {
	const users = loadUsers();
	const index = users.findIndex((u) => u.email === email);
	const session = getInitialUser();
	if (index !== -1) {
		users[index] = { ...users[index], ...updates };
		saveUsers(users);

		// Also update the active session so navbar/account UI refresh immediately.
		if (session && session.email === email) {
			const nextSession = {
				...session,
				...updates,
				name: updates.name || updates.fullName || session.name,
				fullName: updates.name || updates.fullName || session.fullName || "",
			};
			localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
			dispatch(setUser(nextSession));
		}
		return { ok: true, user: users[index] };
	}

	const user = { ...(session || {}), email, ...updates };
	users.push(user);
	saveUsers(users);
	if (session && session.email === email) {
		localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, ...updates }));
		dispatch(setUser({ ...session, ...updates }));
	}
	return { ok: true, user };
};

export const selectUser = (state) => state.auth.user;

export default authSlice.reducer;
