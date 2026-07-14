import express from "express";
import { GetHomepageSettings } from "../controller/homepage.controller.js";

const router = express.Router();

router.get("/settings", GetHomepageSettings);

export default router;
