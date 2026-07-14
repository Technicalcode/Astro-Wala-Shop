import express from "express";

import { TokenVerify } from "../middlewere/auth.middlewere.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controller/wishlist.controller.js";

const router = express.Router();

router.get("/get-wishlist", TokenVerify, getWishlist);
router.get("/me", TokenVerify, getWishlist);
router.post("/add-wishlist/:productId", TokenVerify, addToWishlist);
router.post("/add/:productId", TokenVerify, addToWishlist);

router.delete("/remove-wishlist/:productId", TokenVerify, removeFromWishlist);
router.delete("/remove/:productId", TokenVerify, removeFromWishlist);
export default router;
