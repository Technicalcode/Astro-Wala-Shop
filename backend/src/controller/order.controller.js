import OrderModel from "../Model/order.model.js";
import ProductModel from "../Model/product.model.js";
import UserProfile from "../Model/userprofile.model.js";
import ReferralSetting from "../Model/ReferralSetting.model.js";
import { prepareOrderData } from "../utils/order-pricing.service.js";

const ADMIN_PURCHASE_ROLES = ["admin", "superAdmin", "orderManager"];
const ADMIN_PURCHASE_MESSAGE =
  "Admin accounts cannot add products to cart or place orders. Please use a customer account.";

export const PlaceOrder = async (req, res) => {
  let session;
  try {
    const userId = req.user.id;
    if (ADMIN_PURCHASE_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: ADMIN_PURCHASE_MESSAGE,
      });
    }

    const {
      items = [],
      shippingAddress: rawShippingAddress,
      paymentMethod,
      coupon,
      idempotencyKey,
      useWallet,
    } = req.body;

    if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
      return res.status(400).json({
        success: false,
        message: "A valid checkout idempotency key is required",
      });
    }

    const existingOrder = await OrderModel.findOne({ user: userId, idempotencyKey });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already placed",
        order: existingOrder,
      });
    }

    if (String(paymentMethod || "cod").toLowerCase() !== "cod") {
      return res.status(400).json({
        success: false,
        message: "Online payments must be completed through Razorpay Checkout",
      });
    }

    const preparedOrder = await prepareOrderData({
      items,
      rawShippingAddress,
      coupon,
      userId,
      redeemCoupon: true,
      useWallet: Boolean(useWallet),
    });

    session = await OrderModel.startSession();
    let order;
    await session.withTransaction(async () => {
      for (const item of preparedOrder.orderItems) {
        const stockUpdate = await ProductModel.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        );
        if (stockUpdate.modifiedCount !== 1) {
          const error = new Error(`${item.name} no longer has enough stock`);
          error.statusCode = 409;
          throw error;
        }
      }

      [order] = await OrderModel.create(
        [{
          user: userId,
          idempotencyKey,
          items: preparedOrder.orderItems,
          shippingAddress: preparedOrder.shippingAddress,
          paymentMethod: "COD",
          paymentStatus: "Pending",
          orderStatus: "Confirmed",
          subtotal: preparedOrder.subtotal,
          shippingCharge: preparedOrder.shippingCharge,
          tax: preparedOrder.tax,
          discount: preparedOrder.discount,
          couponDiscount: preparedOrder.couponDiscount,
          walletDiscount: preparedOrder.walletDiscount,
          totalAmount: preparedOrder.totalAmount,
          coupon: preparedOrder.couponId,
        }],
        { session },
      );

      // Referral Reward Logic: if first order, reward referrer
      const pastOrdersCount = await OrderModel.countDocuments({ user: userId, _id: { $ne: order._id } }).session(session);
      if (pastOrdersCount === 0) {
        const userProfile = await UserProfile.findOne({ userid: userId }).session(session);
        if (userProfile && userProfile.referredBy) {
          const referrerProfile = await UserProfile.findOne({ userid: userProfile.referredBy }).session(session);
          if (referrerProfile) {
            const settings = await ReferralSetting.getSettings();
            referrerProfile.walletBalance = (referrerProfile.walletBalance || 0) + settings.referrerRewardAmount;
            referrerProfile.totalWalletCreditEarned = (referrerProfile.totalWalletCreditEarned || 0) + settings.referrerRewardAmount;
            referrerProfile.totalReferrals = (referrerProfile.totalReferrals || 0) + 1;
            await referrerProfile.save({ session });
          }
        }
      }

      // Deduct Wallet Balance if used
      if (preparedOrder.walletDiscount > 0) {
        await UserProfile.updateOne(
          { userid: userId },
          { $inc: { walletBalance: -preparedOrder.walletDiscount } },
          { session }
        );
      }
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    if (error?.code === 11000 && req.body?.idempotencyKey) {
      const order = await OrderModel.findOne({
        user: req.user.id,
        idempotencyKey: req.body.idempotencyKey,
      });
      if (order) {
        return res.status(200).json({ success: true, message: "Order already placed", order });
      }
    }
    console.log(error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  } finally {
    if (session) await session.endSession();
  }
};

export const GetMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await OrderModel.find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GetAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("user", "email role")
      .populate("items.product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GetSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findById(orderId)
      .populate("user", "email role")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isOwner = order.user._id.toString() === req.user.id;
    const isAdmin = ["admin", "superAdmin", "orderManager"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const UpdateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const CancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (order.orderStatus !== "Pending" && order.orderStatus !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    for (const item of order.items) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
