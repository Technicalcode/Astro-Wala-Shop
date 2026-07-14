import express from "express";
import {
  CreateProduct,
  GetAllProduct,
  DeleteProduct,
  GetProductById,
  UpdateProduct,
  GetProductsByCategory,
  GetDeliveryEstimate,
} from "../controller/product.controller.js";
import image from "../middlewere/image.middlewere.js";

import { isAdmin } from "../middlewere/is-admin.middlewere.js";

const routes = express.Router();

routes.post("/create", isAdmin, image.single("User_image"), CreateProduct);

routes.get("/all-product", GetAllProduct);

routes.get("/product-id/:id", GetProductById);

routes.get("/category/:categoryId", GetProductsByCategory);

routes.get("/:id/delivery-estimate", GetDeliveryEstimate);

routes.delete("/delete/:id", isAdmin, DeleteProduct);

routes.put(
  "/update/:id",
  isAdmin,
  image.single("User_image"),
  UpdateProduct,
);

export default routes;
