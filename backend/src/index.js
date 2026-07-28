import express from "express";
import dotenv from "dotenv";
import cros from "cors";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import auth from "./router/auth.routes.js";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import db from "./Database/mongo.db.js";
import cate from "./router/categoty.routes.js";
import product from "./router/product.routes.js";
import addtocart from "./router/cart.routes.js";
import inventory from "./router/inventory.routes.js";
import order from "./router/order.routes.js";
import admin from "./router/admin.routes.js";
import coupon from "./router/coupon.routes.js";
import banner from "./router/banner.routes.js";
import review from "./router/review.routes.js";
import policy from "./router/policy.routes.js";
import returnRoutes from "./router/return.routes.js";
import paymentRoutes from "./router/payment.routes.js";
import homepageRoutes from "./router/homepage.routes.js";
import referralRoutes from "./router/referral.routes.js";
import analyticsRoutes from "./router/analytics.routes.js";
import themeRoutes from "./router/theme.routes.js";
import contactRoutes from "./router/contact.routes.js";
import footerRoutes from "./router/footer.routes.js";
import aboutPageRoutes from "./router/aboutPage.routes.js";

// import db from "./Database/db.js";

import userprofile from "../src/router/User_profile.routes.js";
import wishlist from "./router/wishlist.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

await db();

const app = express();

app.use(express.json());
app.use(
	cros({
		origin: "*",
	})
);
app.use("/api/v1/auth", auth);

app.use("/api/v1/user/profile", userprofile);

app.use("/api/v1/category", cate);

app.use("/api/v1/product", product);

app.use("/api/v1/cart", addtocart);

app.use("/api/v1/wishlist", wishlist);

app.use("/api/v1/inventory", inventory);
app.use("/api/v1/order", order);
app.use("/api/v1/coupon", coupon);
app.use("/api/v1/banner", banner);
app.use("/api/v1/review", review);
app.use("/api/v1/policy", policy);
app.use("/api/v1/returns", returnRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin", admin);
app.use("/api/v1/referral", referralRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/homepage", homepageRoutes);
app.use("/api/v1/theme", themeRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/footer", footerRoutes);
app.use("/api/v1/about-page", aboutPageRoutes);

app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
		return res.status(400).json({ message: "Request body contains invalid JSON" });
	}

	console.error("Unhandled request error:", err);
	return res.status(500).json({ message: "Internal server error" });
});

app.listen(process.env.port || 3000, () =>
	console.log(`Server is running on port ${process.env.port || 3000}`)
);

export default app;
