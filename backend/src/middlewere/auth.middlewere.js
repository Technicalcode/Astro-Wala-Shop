import jwt from "jsonwebtoken";
import UserModel from "../Model/User.model.js";

export const TokenVerify = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token is required",
      });
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.acess_token);
    const user = await UserModel.findById(decoded.id).select(
      "role isActive isBlocked",
    );

    if (!user) {
      return res.status(401).json({ message: "Account no longer exists" });
    }

    if (user.isBlocked || user.isActive === false) {
      return res.status(403).json({
        message: "Your account is blocked. Please contact support.",
      });
    }

    req.user = { ...decoded, id: String(user._id), role: user.role };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
