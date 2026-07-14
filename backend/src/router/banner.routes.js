import express from "express";
import {
  CreateBanner,
  DeleteBanner,
  GetAllBanners,
  GetBannerById,
  UpdateBanner,
} from "../controller/banner.controller.js";
import image from "../middlewere/image.middlewere.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";

const routes = express.Router();

routes.get("/all-banners", GetAllBanners);
routes.get("/:id", GetBannerById);

routes.post("/create", isAdmin, image.single("banner_image"), CreateBanner);
routes.put("/update/:id", isAdmin, image.single("banner_image"), UpdateBanner);
routes.delete("/delete/:id", isAdmin, DeleteBanner);

export default routes;
