import express from "express";
import { TokenVerify } from "../middlewere/auth.middlewere.js";
import {
  ApplyCoupon,
  GetAvailableCoupons,
} from "../controller/coupon.controller.js";

const router = express.Router();

router.get("/active", TokenVerify, GetAvailableCoupons);
router.post("/apply", TokenVerify, ApplyCoupon);

export default router;
