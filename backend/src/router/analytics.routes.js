import express from "express";
import { TrackPageView, GetPageViews, TrackVisitor, GetDailyTraffic } from "../controller/analytics.controller.js";
import { TokenVerify } from "../middlewere/auth.middlewere.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";

const routes = express.Router();

routes.post("/track-page", TrackPageView);
routes.post("/track-visitor", TrackVisitor);
routes.get("/page-views", TokenVerify, isAdmin, GetPageViews);
routes.get("/traffic", TokenVerify, isAdmin, GetDailyTraffic);

export default routes;
