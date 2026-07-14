import express from "express";
import {
  CancelOrder,
  GetAllOrders,
  GetMyOrders,
  GetSingleOrder,
  PlaceOrder,
  UpdateOrderStatus,
} from "../controller/order.controller.js";
import { TokenVerify } from "../middlewere/auth.middlewere.js";
import UserModel from "../Model/User.model.js";

const routes = express.Router();

const canManageOrders = async (req, res, next) => {
  const allowedRoles = ["admin", "superAdmin", "orderManager"];

  if (!allowedRoles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to manage orders",
    });
  }

  const user = await UserModel.findById(req.user.id).select("role isActive");

  if (!user || user.isActive === false || !allowedRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to manage orders",
    });
  }

  req.user.role = user.role;

  next();
};

routes.post("/create", TokenVerify, PlaceOrder);
routes.post("/place-order", TokenVerify, PlaceOrder);
routes.get("/my-orders", TokenVerify, GetMyOrders);
routes.get("/all", TokenVerify, canManageOrders, GetAllOrders);
routes.get("/:orderId", TokenVerify, GetSingleOrder);
routes.patch("/:orderId/status", TokenVerify, canManageOrders, UpdateOrderStatus);
routes.patch("/:orderId/cancel", TokenVerify, CancelOrder);

export default routes;
