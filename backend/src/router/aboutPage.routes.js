import express from "express";
import { GetAboutPage, UpdateAboutPage } from "../controller/aboutPage.controller.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";

const routes = express.Router();

routes.get("/", GetAboutPage);
routes.put("/", isAdmin, UpdateAboutPage);

export default routes;
