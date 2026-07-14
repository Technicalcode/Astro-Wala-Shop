import express from "express";
import { TokenVerify } from "../middlewere/auth.middlewere.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";
import {
  getReferralSettings,
  updateReferralSettings,
  getReferralStats,
  getReferralDetails,
  deleteReferrerRecord,
  deleteDiscountRecord
} from "../controller/referral.controller.js";

const router = express.Router();

router.get("/admin/settings", TokenVerify, isAdmin, getReferralSettings);
router.put("/admin/settings", TokenVerify, isAdmin, updateReferralSettings);
router.get("/admin/stats", TokenVerify, isAdmin, getReferralStats);
router.get("/admin/details", TokenVerify, isAdmin, getReferralDetails);
router.delete("/admin/referrer/:id", TokenVerify, isAdmin, deleteReferrerRecord);
router.delete("/admin/discount/:id", TokenVerify, isAdmin, deleteDiscountRecord);

export default router;
