import { access } from "node:fs";
import token, {
	generateAccessToken,
	generateRefreshToken,
} from "../utils/token.js";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";
import crypto from "crypto";
import { createVerify } from "crypto";

import emailverificationmodel from "../Model/emailverification.model.js";

// import CreateHashPassword from "../PasswordHash/password.js";

// import verfilypass from "../PasswordHash/password.js";
import {
	CreateHashPassword,
	CreateharhPassword,
	VerfiyPaswword,
} from "../PasswordHash/password.js";

import supabase from "../Database/db.js";

import sendEmail from "../utils/email.js";
import UserModel from "../Model/User.model.js";
import UserProfile from "../Model/userprofile.model.js";
import { SendVerficationEmail } from "../utils/send-verfication-email.js";
import {
	CloseLoginActivity,
	CreateLoginActivity,
} from "./login-activity.controller.js";
import CouponModel from "../Model/coupon.model.js";
import ReferralSetting from "../Model/ReferralSetting.model.js";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v1/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
let googleCertCache = {
	expiresAt: 0,
	certs: {},
};

const escapeRegex = (value = "") =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findUserByEmail = async (email) => {
	const normalizedEmail = normalizeEmail(email);
	if (!normalizedEmail) return null;

	return UserModel.findOne({
		email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" },
	});
};

const getProfileDisplayName = (profile) => {
	if (!profile) return "";

	return (
		profile.fullName ||
		[profile.firstName, profile.middleName, profile.lastName]
			.filter(Boolean)
			.join(" ")
			.trim()
	);
};

const verifyStoredPassword = async (password, storedPassword) => {
	if (!password || !storedPassword) return false;

	if (await VerfiyPaswword(password, storedPassword)) return true;

	try {
		return await bcrypt.compare(password, storedPassword);
	} catch {
		return false;
	}
};

const base64UrlToBuffer = (value = "") =>
	Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");

const decodeJwtPart = (value = "") =>
	JSON.parse(base64UrlToBuffer(value).toString("utf8"));

const getGoogleCerts = async () => {
	if (googleCertCache.expiresAt > Date.now() && Object.keys(googleCertCache.certs).length) {
		return googleCertCache.certs;
	}

	const response = await fetch(GOOGLE_CERTS_URL);
	if (!response.ok) {
		throw new Error("Could not fetch Google public certificates");
	}

	const cacheControl = response.headers.get("cache-control") || "";
	const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
	const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 60 * 60 * 1000;
	const certs = await response.json();
	googleCertCache = {
		certs,
		expiresAt: Date.now() + maxAgeMs,
	};

	return certs;
};

const verifyGoogleCredential = async (credential) => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		throw new Error("Google login is not configured on the server");
	}

	const parts = String(credential || "").split(".");
	if (parts.length !== 3) throw new Error("Invalid Google credential");

	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	const header = decodeJwtPart(encodedHeader);
	const payload = decodeJwtPart(encodedPayload);

	if (header.alg !== "RS256" || !header.kid) {
		throw new Error("Invalid Google token header");
	}

	const certs = await getGoogleCerts();
	const cert = certs[header.kid];
	if (!cert) throw new Error("Google certificate not found for this token");

	const verifier = createVerify("RSA-SHA256");
	verifier.update(`${encodedHeader}.${encodedPayload}`);
	verifier.end();

	const isValidSignature = verifier.verify(cert, base64UrlToBuffer(encodedSignature));
	if (!isValidSignature) throw new Error("Invalid Google token signature");

	if (!GOOGLE_ISSUERS.has(payload.iss)) throw new Error("Invalid Google token issuer");
	if (payload.aud !== clientId) throw new Error("Invalid Google token audience");
	if (!payload.exp || payload.exp * 1000 <= Date.now()) {
		throw new Error("Google token has expired");
	}
	if (payload.email_verified !== true) {
		throw new Error("Google account email is not verified");
	}

	return {
		email: normalizeEmail(payload.email),
		name: String(payload.name || "").trim(),
		firstName: String(payload.given_name || "").trim(),
		lastName: String(payload.family_name || "").trim(),
		avatar: String(payload.picture || "").trim(),
		googleId: String(payload.sub || "").trim(),
	};
};

const buildLoginResponse = async (req, res, user) => {
	const accessToken = generateAccessToken(user.id, user.role);
	const refreshToken = generateRefreshToken(user.id, user.role);
	const profile = await UserProfile.findOne({ userid: user.id }).select(
		"fullName firstName middleName lastName"
	);
	const displayName = getProfileDisplayName(profile);
	const loginActivity = await CreateLoginActivity(req, user.id);

	return res.status(200).json({
		message: "Login successful",
		user: {
			id: user.id,
			email: user.email,
			name: displayName,
			fullName: displayName,
			role: user.role,
		},
		token: {
			accessToken,
			refreshToken,
		},
		loginActivityId: loginActivity?._id || null,
	});
};

export const login = async (req, res) => {
	try {
		const { Email, Password } = req.body;
		const email = normalizeEmail(Email);

		// Validate input
		if (!email || !Password) {
			return res.status(400).json({
				message: "Email and password are required",
			});
		}

		const user = await findUserByEmail(email);

		if (!user) {
			return res.status(400).json({
				message: "User not found",
			});
		}

		if (user.isBlocked === true) {
			return res.status(403).json({
				message: "Your account is blocked. Please contact support.",
			});
		}

		// Accounts created by the old signup flow used isActive=false for
		// unverified users. They were never admin-blocked and can be repaired.
		if (user.isActive === false) {
			user.isActive = true;
			await user.save();
		}

		// Find user by email
		// const { data: user, error } = await supabase
		//   .from("UserModel")
		//   .select("*")
		//   .eq("Email", email)
		//   .single();

		// if (error || !user) {
		//   return res.status(401).json({
		//     message: "User not found in sql",
		//   });
		// }

		// Verify password

		const isPasswordValid = await verifyStoredPassword(Password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({
				message: "Invalid email or password",
			});
		}

		// Generate tokens

		// if (user.isVerified === false) {
		//   return res.status(401).json({
		//     message: "User not verified",
		//   });
		// }
		return buildLoginResponse(req, res, user);
	} catch (ex) {
		console.error(ex);

		return res.status(500).json({
			message: ex.message,
		});
	}
};

export const GoogleLogin = async (req, res) => {
	try {
		const profile = await verifyGoogleCredential(req.body?.credential);
		if (!profile.email) {
			return res.status(400).json({ message: "Google account email was not provided" });
		}

		let user = await findUserByEmail(profile.email);
		if (user?.isBlocked === true) {
			return res.status(403).json({
				message: "Your account is blocked. Please contact support.",
			});
		}

		if (!user) {
			const randomPassword = await CreateharhPassword(
				`google:${profile.googleId}:${crypto.randomBytes(24).toString("hex")}`,
			);
			user = await UserModel.create({
				email: profile.email,
				password: randomPassword,
				role: "user",
				isActive: true,
				isBlocked: false,
				isVerified: true,
			});
		} else {
			user.isActive = true;
			user.isVerified = true;
			await user.save();
		}

		const existingProfile = await UserProfile.findOne({ userid: user._id });
		if (!existingProfile) {
			await UserProfile.create({
				userid: user._id,
				referralCode: `ASTRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
				fullName: profile.name,
				firstName: profile.firstName,
				lastName: profile.lastName,
				avatar: profile.avatar,
			});
		} else {
			if (profile.name && !existingProfile.fullName) existingProfile.fullName = profile.name;
			if (profile.firstName && !existingProfile.firstName) existingProfile.firstName = profile.firstName;
			if (profile.lastName && !existingProfile.lastName) existingProfile.lastName = profile.lastName;
			if (profile.avatar && !existingProfile.avatar) existingProfile.avatar = profile.avatar;
			await existingProfile.save();
		}

		return buildLoginResponse(req, res, user);
	} catch (error) {
		return res.status(401).json({
			message: error.message || "Google login failed",
		});
	}
};

export const Logout = async (req, res) => {
	try {
		const { loginActivityId } = req.body || {};
		const activity = await CloseLoginActivity(req.user.id, loginActivityId);

		return res.status(200).json({
			success: true,
			message: "Logout successful",
			activityClosed: Boolean(activity),
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const CreateUser = async (req, res) => {
	try {
		const { Email, Password, referralCode } = req.body;
		const email = normalizeEmail(Email);

		// 1. Validate request
		if (!email || !Password) {
			return res.status(400).json({
				message: "All fields are required",
			});
		}

		if (!EMAIL_PATTERN.test(email)) {
			return res.status(400).json({ message: "Enter a valid email address" });
		}

		if (String(Password).length < MIN_PASSWORD_LENGTH) {
			return res.status(400).json({
				message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
			});
		}

		// 2. Check if user already exists
		const existingUser = await CheckUser(email);

		if (existingUser) {
			return res.status(400).json({
				message: "User already exists",
			});
		}

		// 3. Hash password
		const hashedPassword = await CreateharhPassword(Password);

		// 4. Create user
		const user = await UserModel.create({
			email,
			password: hashedPassword,
			role: "user",
			isActive: true,
			isBlocked: false,
			isVerified: false,
		});

		if (!user) {
			return res.status(500).json({
				message: "User creation failed",
			});
		}

		// Check referral code
		let referredBy = null;
		if (referralCode) {
			const referrerProfile = await UserProfile.findOne({ referralCode: String(referralCode).trim().toUpperCase() });
			if (referrerProfile) {
				referredBy = referrerProfile.userid;
			}
		}

		// Create user profile with their own new referral code
		const myReferralCode = `ASTRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
		await UserProfile.create({
			userid: user._id,
			referralCode: myReferralCode,
			referredBy: referredBy,
		});

		// If referred, create a coupon for this new user based on Admin settings
		if (referredBy) {
			const settings = await ReferralSetting.getSettings();
			const isPercentage = settings.signupDiscountType === 'percentage';
			
			await CouponModel.create({
				targetType: "all",
				discountType: settings.signupDiscountType || "fixed",
				discountValue: settings.signupDiscountAmount,
				startDate: new Date(),
				expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
				maxLimit: 1,
				minPurchaseAmount: isPercentage ? 0 : settings.signupDiscountAmount,
				assignedUser: user._id,
				customerEmail: user.email,
				isActive: true,
			});
		}

		// 5. Generate verification token
		const token = crypto.randomBytes(64).toString("hex");

		// 6. Save verification token
		const emailVerification = await emailverificationmodel.create({
			userId: user._id,
			token: token,
			email,
			isUsed: false,
			createdAt: new Date(),
		});

		if (!emailVerification) {
			return res.status(500).json({
				message: "Failed to create verification token",
			});
		}

		// 7. Verification link
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
		const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

		// 8. Send verification email
		// await sendEmail(Email, token);

		await SendVerficationEmail(Email, token);

		// 9. Remove password from response
		const { password, ...userData } = user.toObject();

		// 10. Success response
		return res.status(201).json({
			message: "User created successfully. Please verify your email.",
			user: userData,
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({
			message: error.message,
		});
	}
};

async function CheckUser(email) {
	try {
		const user = await findUserByEmail(email);

		return user;
	} catch (error) {
		console.log("DB Error:", error);
		return null;
	}
}

export const EmailVerfily = async (req, res) => {
	try {
		const token = req.headers["x-verification-token"];

		if (!token) {
			return res.status(400).json({
				message: "Token is required",
			});
		}

		// Find verification token
		const emailVerification = await emailverificationmodel.findOne({ token });

		if (!emailVerification) {
			return res.status(400).json({
				message: "Invalid token",
			});
		}

		if (emailVerification.isUsed) {
			return res.status(400).json({
				message: "Email already verified",
			});
		}

		// Update user
		const user = await UserModel.findByIdAndUpdate(
			emailVerification.userId,
			{
				isVerified: true,
				isActive: true,
				isBlocked: false,
				blockedAt: null,
			},
			{ new: true }
		);

		if (!user) {
			return res.status(404).json({
				message: "User not found",
			});
		}

		// Mark token as used
		await emailverificationmodel.findByIdAndUpdate(emailVerification._id, {
			isUsed: true,
			token: null,
		});

		return res.status(200).json({
			message: "Email verified successfully",
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			message: error.message,
		});
	}
}; const hashPasswordResetToken = (resetToken) =>
  crypto.createHash("sha256").update(String(resetToken)).digest("hex");

  const getPasswordResetTokenTtlMs = () => {
  const configuredMinutes = Number.parseInt(
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES,
    10,
  );
  const ttlMinutes =
    Number.isInteger(configuredMinutes) && configuredMinutes > 0
      ? Math.min(configuredMinutes, 1440)
      : 15;

  return ttlMinutes * 60 * 1000;
};

export const ForgetPassword = async (req, res) => {
	try {
		const email = normalizeEmail(req.body?.email);

		if (!email || !EMAIL_PATTERN.test(email)) {
			return res.status(400).json({
				message: "Enter a valid email address",
			});
		}

		// Find user
		const user = await findUserByEmail(email);

		if (!user) {
			return res.status(200).json({
				message: "If an account exists, a password reset email has been sent.",
			});
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(64).toString("hex");
		const passwordResetTokenHash = hashPasswordResetToken(resetToken);
    const passwordResetTokenExpiresAt = new Date(
      Date.now() + getPasswordResetTokenTtlMs(),
    );

		// Save token
		user.Resettoken = resetToken;
		user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

		await user.save();
console.log("Reset token saved:", resetToken);
		// Send email
		await sendEmail(email, resetToken);



		return res.status(200).json({
			message: "Password reset email sent successfully.",
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({
			message: error.message,
		});
	}
};
export const ResetPassword = async (req, res) => {
	try {
		const { resetToken, password } = req.body;

		// Validate request
		if (!resetToken || !password) {
			return res.status(400).json({
				message: "All fields are required",
			});
		}

		if (String(password).length < MIN_PASSWORD_LENGTH) {
			return res.status(400).json({
				message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
			});
		}

		// Find user by reset token
		const user = await UserModel.findOne({
			Resettoken: resetToken,
			resetTokenExpiresAt: { $gt: new Date() },
		});

		if (!user) {
			return res.status(404).json({
				message: "Invalid or expired reset token",
			});
		}

		// Check token expiration

		// Hash new password
		const hashedPassword = await CreateharhPassword(password);

		// Update user
		user.password = hashedPassword;
		user.Resettoken = null;
		user.resetTokenExpiresAt = null;

		await user.save();

		return res.status(200).json({
			message: "Password reset successfully.",
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({
			message: error.message,
		});
	}
};

export const RefreshToken = async (req, res) => {
	try {
		const refreshToken =
			req.body?.refreshToken ||
			req.query?.refreshToken ||
			req.headers["x-refresh-token"];

		if (!refreshToken) {
			return res.status(400).json({ message: "Refresh token is required" });
		}

		const decoded = jwt.verify(refreshToken, process.env.refresh_token);
		const user = await UserModel.findById(decoded.id).select(
			"role isActive isBlocked"
		);

		if (!user || user.isBlocked === true || user.isActive === false) {
			return res.status(403).json({
				message: "Account access is blocked",
			});
		}

		const newAccessToken = generateAccessToken(user.id, user.role);
		const newRefreshToken = generateRefreshToken(user.id, user.role);

		return res.status(200).json({
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			token: {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			},
		});
	} catch (error) {
		return res.status(401).json({ message: error.message });
	}
};
