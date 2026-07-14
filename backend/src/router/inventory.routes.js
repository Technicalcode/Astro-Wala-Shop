import express from "express";
import {
	CreateInventory,
	GetAllInventory,
	GetInventoryByProduct,
	InsertMissingInventoryFromProducts,
	UpdateStock,
} from "../controller/inventory.controller.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";

const routes = express.Router();

routes.post("/create", CreateInventory);//done
routes.post("/insert-missing", isAdmin, InsertMissingInventoryFromProducts);//done
routes.get("/get-inventory", GetAllInventory); //done
routes.get("/:productId",  GetInventoryByProduct); //done
routes.put("/:productId",  UpdateStock); //done

export default routes;
