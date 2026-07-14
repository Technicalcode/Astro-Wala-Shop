import express from "express";
import {
  CreatePolicy,
  DeletePolicy,
  GetAllPolicies,
  GetPolicyBySlug,
  UpdatePolicy,
} from "../controller/policy.controller.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";

const routes = express.Router();

routes.get("/all-policies", GetAllPolicies);

routes.post("/create", isAdmin, CreatePolicy);
routes.put("/update/:id", isAdmin, UpdatePolicy);
routes.delete("/delete/:id", isAdmin, DeletePolicy);

routes.get("/:slug", GetPolicyBySlug);

export default routes;
