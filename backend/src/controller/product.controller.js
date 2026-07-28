import Product from "../Model/product.model.js";
import productModel from "../Model/product.model.js";
import ReviewModel from "../Model/review.model.js";
import { deleteImageAsset, saveImageAsset } from "../utils/image-upload.js";

const METRO_PIN_PREFIXES = new Set([
  "11",
  "12",
  "20",
  "38",
  "40",
  "41",
  "50",
  "56",
  "60",
  "70",
]);
const REMOTE_PIN_PREFIXES = new Set([
  "17",
  "18",
  "19",
  "71",
  "72",
  "73",
  "74",
  "77",
  "78",
  "79",
]);

const addDeliveryDays = (startDate, days) => {
  const date = new Date(startDate);
  let remaining = days;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) remaining -= 1;
  }

  return date;
};

const getDeliveryRange = (pincode) => {
  const prefix = pincode.slice(0, 2);

  if (METRO_PIN_PREFIXES.has(prefix)) return { minDays: 2, maxDays: 4 };
  if (REMOTE_PIN_PREFIXES.has(prefix)) return { minDays: 5, maxDays: 8 };
  return { minDays: 3, maxDays: 6 };
};

const toBoolean = (value) =>
  value === true || value === "true" || value === "1" || value === 1;

const normalizeProductStyles = (value) => {
  let styles = value;
  if (typeof value === "string") {
    try {
      styles = JSON.parse(value);
    } catch {
      styles = {};
    }
  }

  const validFontFamilies = ["default", "serif", "sans", "mono"];
  const validWeights = ["normal", "medium", "semibold", "bold"];
  const validStyles = ["normal", "italic"];
  const clamp = (input, fallback, max = 96) => {
    const number = Number(input);
    if (Number.isNaN(number)) return fallback;
    return Math.min(max, Math.max(1, number));
  };
  const normalizeBlock = (block = {}, fallback = {}) => ({
    fontFamily: validFontFamilies.includes(block.fontFamily) ? block.fontFamily : fallback.fontFamily,
    fontSize: clamp(block.fontSize, fallback.fontSize, fallback.maxSize),
    fontWeight: validWeights.includes(block.fontWeight) ? block.fontWeight : fallback.fontWeight,
    fontStyle: validStyles.includes(block.fontStyle) ? block.fontStyle : fallback.fontStyle,
    textColor: /^#[0-9a-f]{6}$/i.test(String(block.textColor || ""))
      ? block.textColor
      : fallback.textColor,
  });

  return {
    name: normalizeBlock(styles?.name, { fontFamily: "default", fontSize: 14, maxSize: 96, fontWeight: "normal", fontStyle: "normal", textColor: "#1F2937" }),
    brand: normalizeBlock(styles?.brand, { fontFamily: "default", fontSize: 12, maxSize: 64, fontWeight: "normal", fontStyle: "normal", textColor: "#6B7280" }),
    price: normalizeBlock(styles?.price, { fontFamily: "default", fontSize: 18, maxSize: 96, fontWeight: "bold", fontStyle: "normal", textColor: "#111827" }),
    highlights: normalizeBlock(styles?.highlights, { fontFamily: "default", fontSize: 14, maxSize: 64, fontWeight: "normal", fontStyle: "normal", textColor: "#4B5563" }),
    description: normalizeBlock(styles?.description, { fontFamily: "default", fontSize: 14, maxSize: 64, fontWeight: "normal", fontStyle: "normal", textColor: "#4B5563" }),
  };
};

const attachReviewSummary = async (products) => {
  const productList = Array.isArray(products) ? products : [products];
  const ids = productList
    .filter(Boolean)
    .map((product) => product._id);

  if (ids.length === 0) return Array.isArray(products) ? [] : null;

  const summaries = await ReviewModel.aggregate([
    {
      $match: {
        product: { $in: ids },
        status: "published",
      },
    },
    {
      $group: {
        _id: "$product",
        rating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const summaryByProduct = new Map(
    summaries.map((summary) => [
      String(summary._id),
      {
        rating: Number(summary.rating.toFixed(1)),
        ratingCount: summary.ratingCount,
      },
    ]),
  );

  const enrichedProducts = productList.map((product) => {
    if (!product) return null;

    const data = product.toObject ? product.toObject() : product;
    const summary = summaryByProduct.get(String(data._id)) || {
      rating: 0,
      ratingCount: 0,
    };

    return {
      ...data,
      ...summary,
    };
  });

  return Array.isArray(products) ? enrichedProducts : enrichedProducts[0];
};

export const CreateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      category_id,
      size,
      brand,
      stock,
      producthightlight,
      bestseller,
      styles,
    } = req.body;

    const missingFields = [];
    if (!name?.trim()) missingFields.push("name");
    if (!description?.trim()) missingFields.push("description");
    if (!price) missingFields.push("price");
    if (!category_id) missingFields.push("category");
    if (!brand?.trim()) missingFields.push("brand");
    if (!producthightlight?.trim()) missingFields.push("product highlights");
    if (stock === undefined || stock === "") missingFields.push("stock");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    console.log(req.body);

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    const imageResult = await saveImageAsset({
      file: req.file,
      folder: "astro-products-image",
      name,
      width: 500,
      height: 500,
      quality: 80,
    });

    const productPrice = Number(price);
    const productMrp = mrp === undefined || mrp === "" ? productPrice : Number(mrp);

    const product = await Product.create({
      name,
      description,
      price: productPrice,
      mrp: Number.isNaN(productMrp) ? productPrice : productMrp,
      category_id,
      size,
      brand,
      producthightlight,
      styles: normalizeProductStyles(styles),
      stock: Number(stock),
      bestseller: toBoolean(bestseller),

      image: imageResult.image,
      public_id: imageResult.public_id,
    });

    // product.save();

    if (!product) {
      return res.status(400).json({
        message: "Product not created",
      });
    }

    return res.status(200).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      message: ex.message,
    });
    s;
  }
};

export const GetAllProduct = async (req, res) => {
  try {
    const product = await productModel.find().populate("category_id").lean();
    if (!product) {
      return res.status(400).json({
        message: "Product not found",
      });
    }
    return res.status(200).json({
      message: "Product found successfully",
      data: await attachReviewSummary(product),
    });
  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      message: ex.message,
    });
  }
};

export const GetProductById = async (req, res) => {
  try {
    const product = await productModel
      .findById(req.params.id)
      .populate("category_id")
      .lean();
    if (!product) {
      return res.status(400).json({
        message: "Product not found",
      });
    }

    product.viewCount = (product.viewCount || 0) + 1;
    await productModel.updateOne(
      { _id: req.params.id },
      { $inc: { viewCount: 1 } },
    );
    return res.status(200).json({
      message: "Product found successfully",
      data: await attachReviewSummary(product),
    });
  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      message: ex.message,
    });
  }
};

export const GetProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ category_id: categoryId })
      .populate("category_id")
      .lean();
    const enrichedProducts = await attachReviewSummary(products);

    return res.status(200).json({
      success: true,
      count: enrichedProducts.length,
      products: enrichedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GetDeliveryEstimate = async (req, res) => {
  try {
    const pincode = String(req.query.pincode || "").trim();

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit Indian PIN code",
      });
    }

    const product = await Product.findById(req.params.id).select("stock");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock <= 0) {
      return res.status(409).json({
        success: false,
        serviceable: false,
        message: "This product is currently out of stock",
      });
    }

    const { minDays, maxDays } = getDeliveryRange(pincode);
    const now = new Date();

    return res.status(200).json({
      success: true,
      serviceable: true,
      data: {
        pincode,
        minDays,
        maxDays,
        earliestDate: addDeliveryDays(now, minDays).toISOString(),
        latestDate: addDeliveryDays(now, maxDays).toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete

export const DeleteProduct = async (req, res) => {
  try {
    const product = await productModel.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(400).json({
        message: "Product not found",
      });
    }

    await deleteImageAsset(product.public_id);

    return res.status(200).json({
      message: "Product deleted successfully",
      data: product,
    });
  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      message: ex.message,
    });
  }
};

// update
export const UpdateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      category_id,
      size,
      brand,
      stock,
      producthightlight,
      bestseller,
      styles,
    } = req.body;

    console.log(req.body);

    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(400).json({
        message: "Product not found",
      });
    }

    if (req.file) {
      const imageResult = await saveImageAsset({
        file: req.file,
        folder: "astro-products-image",
        name: name || product.name,
        width: 500,
        height: 500,
        quality: 80,
      });

      await deleteImageAsset(product.public_id);

      product.image = imageResult.image;
      product.public_id = imageResult.public_id;
    }

    if (name !== undefined) product.name = name;
    if (size !== undefined) product.size = size;
    if (brand !== undefined) product.brand = brand;
    if (producthightlight !== undefined) product.producthightlight = producthightlight;
    if (styles !== undefined) product.styles = normalizeProductStyles(styles);
    if (description !== undefined) product.description = description;
    if (price !== undefined && price !== "") product.price = Number(price);
    if (mrp !== undefined && mrp !== "") product.mrp = Number(mrp);
    if ((product.mrp === undefined || product.mrp === null) && product.price !== undefined) {
      product.mrp = product.price;
    }
    if (category_id !== undefined && category_id !== "") product.category_id = category_id;
    if (stock !== undefined && stock !== "") product.stock = Number(stock);
    if (bestseller !== undefined) product.bestseller = toBoolean(bestseller);
    await product.save();
    return res.status(200).json({
      message: "Product updated successfully",
      data: product,
    });
  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      message: ex.message,
    });
  }
};
