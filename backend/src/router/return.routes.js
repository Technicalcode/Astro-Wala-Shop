import express from "express";
import {
  CreateReturnRequest,
  GetMyReturns,
  GetReturnById,
} from "../controller/return.controller.js";
import { TokenVerify } from "../middlewere/auth.middlewere.js";

const router = express.Router();

router.post("/", TokenVerify, CreateReturnRequest);
router.get("/my", TokenVerify, GetMyReturns);
router.get("/:id", TokenVerify, GetReturnById);

export default router;
