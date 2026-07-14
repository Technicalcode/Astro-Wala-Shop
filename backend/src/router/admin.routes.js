import express from "express";
import {
  BlockUser,
  GetAllUsers,
  GetDashboard,
  UnBlockUser,
} from "../controller/admin.controller.js";
import { GetAuditLogs } from "../controller/audit.controller.js";
import {
  AdminCreateCoupon,
  AdminDeleteCoupon,
  AdminGetCoupons,
  AdminUpdateCoupon,
} from "../controller/coupon.controller.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";
import { GetLoginActivities } from "../controller/login-activity.controller.js";
import {
  AdminGetReturns,
  AdminUpdateReturnStatus,
} from "../controller/return.controller.js";
import { UpdateHomepageSettings } from "../controller/homepage.controller.js";

const router = express.Router();

router.get("/dashboard", isAdmin, GetDashboard);
router.get("/audit-logs", isAdmin, GetAuditLogs);
router.get("/login-activities", isAdmin, GetLoginActivities);
router.get("/returns", isAdmin, AdminGetReturns);
router.patch("/returns/:id/status", isAdmin, AdminUpdateReturnStatus);
router.get("/all-users", isAdmin, GetAllUsers);
router.put("/block/:id", isAdmin, BlockUser);
router.put("/unblock/:id", isAdmin, UnBlockUser);
router.get("/coupons", isAdmin, AdminGetCoupons);
router.post("/coupons", isAdmin, AdminCreateCoupon);
router.put("/coupons/:id", isAdmin, AdminUpdateCoupon);
router.delete("/coupons/:id", isAdmin, AdminDeleteCoupon);
router.put("/homepage/settings", isAdmin, UpdateHomepageSettings);

export default router;
