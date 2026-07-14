import express from "express";

// import { addtocart } from "../controller/cart.controller.js";

import {
  addToCart,
  singleProduct,
  incrementQuantity,
  decrementedQuantity,
  updateQuantity,
  getCart,
  deletecartproduct,
  clearCart,
} from "../controller/cart.controller.js";

const router = express.Router();
import { TokenVerify } from "../middlewere/auth.middlewere.js";

router.get("/", (req, res) => {
  res.send("hello world");
});

router.post("/bulk", TokenVerify, addToCart);

// single product

router.post("/single-add", TokenVerify, singleProduct);
router.post("/add", TokenVerify, singleProduct);

router.patch("/quantity", TokenVerify, updateQuantity);
router.patch("/increment-quantity", TokenVerify, incrementQuantity);
router.patch("/decrement-quantity", TokenVerify, decrementedQuantity);

router.get("/get-all", TokenVerify, getCart);
router.get("/me", TokenVerify, getCart);

router.delete("/delete", TokenVerify, deletecartproduct);
router.delete("/clear", TokenVerify, clearCart);

export default router;
