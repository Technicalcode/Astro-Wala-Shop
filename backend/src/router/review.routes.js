import express from "express";
import {
  CreateOrUpdateReview,
  DeleteReview,
  GetMyReviews,
  GetAdminReviews,
  GetProductReviews,
  GetReviewEligibility,
  UpdateReview,
  UpdateAdminReviewStatus,
  DeleteAdminReview,
} from "../controller/review.controller.js";
import { TokenVerify } from "../middlewere/auth.middlewere.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";
import image from "../middlewere/image.middlewere.js";

const routes = express.Router();

routes.get("/product/:productId", GetProductReviews);
routes.get("/product/:productId/eligibility", TokenVerify, GetReviewEligibility);
routes.post("/product/:productId", TokenVerify, image.single("Review_image"), CreateOrUpdateReview);
routes.get("/admin/all", isAdmin, GetAdminReviews);
routes.patch("/admin/:reviewId/status", isAdmin, UpdateAdminReviewStatus);
routes.delete("/admin/:reviewId", isAdmin, DeleteAdminReview);
routes.get("/my-reviews", TokenVerify, GetMyReviews);
routes.put("/:reviewId", TokenVerify, image.single("Review_image"), UpdateReview);
routes.delete("/:reviewId", TokenVerify, DeleteReview);

export default routes;
