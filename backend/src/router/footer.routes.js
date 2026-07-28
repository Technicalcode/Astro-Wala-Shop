import express from "express";
import { GetFooterSettings, UpdateFooterSettings } from "../controller/footer.controller.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";

const routes = express.Router();

routes.get("/settings", GetFooterSettings);
routes.put("/settings", isAdmin, UpdateFooterSettings);

export default routes;
