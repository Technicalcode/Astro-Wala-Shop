import express from "express";
import {
  CreateRazorpayOrder,
  VerifyRazorpayPayment,
} from "../controller/payment.controller.js";
import { TokenVerify } from "../middlewere/auth.middlewere.js";

const router = express.Router();

router.post("/razorpay/order", TokenVerify, CreateRazorpayOrder);
router.post("/razorpay/verify", TokenVerify, VerifyRazorpayPayment);

export default router;
