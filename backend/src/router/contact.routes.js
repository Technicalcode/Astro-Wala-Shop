import express from "express";
import {
  CreateContactMessage,
  DeleteContactMessage,
  GetAdminContactMessages,
  GetMyContactMessages,
  ReplyToContactMessage,
  UpdateContactMessageStatus,
} from "../controller/contact.controller.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";
import { TokenVerify } from "../middlewere/auth.middlewere.js";

const routes = express.Router();

routes.post("/", CreateContactMessage);
routes.get("/my", TokenVerify, GetMyContactMessages);
routes.get("/admin/all", isAdmin, GetAdminContactMessages);
routes.post("/admin/:messageId/reply", isAdmin, ReplyToContactMessage);
routes.patch("/admin/:messageId/status", isAdmin, UpdateContactMessageStatus);
routes.delete("/admin/:messageId", isAdmin, DeleteContactMessage);

export default routes;
