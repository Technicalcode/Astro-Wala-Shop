import express from "express";
import ThemeSetting from "../Model/ThemeSetting.model.js";
import { isAdmin } from "../middlewere/is-admin.middlewere.js";
import { TokenVerify } from "../middlewere/auth.middlewere.js";

const router = express.Router();

// Public route to fetch editable styles
router.get("/editable-styles", async (req, res) => {
  try {
    let themeSetting = await ThemeSetting.findOne({ key: "editable_styles" });
    if (!themeSetting) {
      themeSetting = await ThemeSetting.create({ key: "editable_styles", styles: {} });
    }
    return res.status(200).json({ styles: themeSetting.styles });
  } catch (error) {
    console.error("Error fetching editable styles:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Admin protected route to update editable styles
router.put("/editable-styles", TokenVerify, isAdmin, async (req, res) => {
  try {
    const { styles } = req.body;
    
    if (typeof styles !== "object" || Array.isArray(styles)) {
      return res.status(400).json({ message: "Styles must be an object" });
    }

    let themeSetting = await ThemeSetting.findOne({ key: "editable_styles" });
    if (!themeSetting) {
      themeSetting = new ThemeSetting({ key: "editable_styles" });
    }

    themeSetting.styles = styles;
    themeSetting.updatedBy = req.user._id; // Assuming user is attached by middlewere
    await themeSetting.save();

    return res.status(200).json({ message: "Styles updated successfully", styles: themeSetting.styles });
  } catch (error) {
    console.error("Error updating editable styles:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
