import mango from "mongoose";
const productSchema = new mango.Schema(
  {
    category_id: {
      type: mango.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    mrp: {
      type: Number,
      default: function () {
        return this.price;
      },
      min: 0,
    },

    size: {
      type: String,
      default: "Standard",
    },

    producthightlight: {
      type: String,
      required: true,
    },

    styles: {
      name: {
        fontFamily: { type: String, enum: ["default", "serif", "sans", "mono"], default: "default" },
        fontSize: { type: Number, default: 14, min: 1, max: 96 },
        fontWeight: { type: String, enum: ["normal", "medium", "semibold", "bold"], default: "normal" },
        fontStyle: { type: String, enum: ["normal", "italic"], default: "normal" },
        textColor: { type: String, default: "#1F2937" },
      },
      brand: {
        fontFamily: { type: String, enum: ["default", "serif", "sans", "mono"], default: "default" },
        fontSize: { type: Number, default: 12, min: 1, max: 64 },
        fontWeight: { type: String, enum: ["normal", "medium", "semibold", "bold"], default: "normal" },
        fontStyle: { type: String, enum: ["normal", "italic"], default: "normal" },
        textColor: { type: String, default: "#6B7280" },
      },
      price: {
        fontFamily: { type: String, enum: ["default", "serif", "sans", "mono"], default: "default" },
        fontSize: { type: Number, default: 18, min: 1, max: 96 },
        fontWeight: { type: String, enum: ["normal", "medium", "semibold", "bold"], default: "bold" },
        fontStyle: { type: String, enum: ["normal", "italic"], default: "normal" },
        textColor: { type: String, default: "#111827" },
      },
      highlights: {
        fontFamily: { type: String, enum: ["default", "serif", "sans", "mono"], default: "default" },
        fontSize: { type: Number, default: 14, min: 1, max: 64 },
        fontWeight: { type: String, enum: ["normal", "medium", "semibold", "bold"], default: "normal" },
        fontStyle: { type: String, enum: ["normal", "italic"], default: "normal" },
        textColor: { type: String, default: "#4B5563" },
      },
      description: {
        fontFamily: { type: String, enum: ["default", "serif", "sans", "mono"], default: "default" },
        fontSize: { type: Number, default: 14, min: 1, max: 64 },
        fontWeight: { type: String, enum: ["normal", "medium", "semibold", "bold"], default: "normal" },
        fontStyle: { type: String, enum: ["normal", "italic"], default: "normal" },
        textColor: { type: String, default: "#4B5563" },
      },
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    bestseller: {
      type: Boolean,
      default: false,
    },

    brand: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ bestseller: 1, category_id: 1 });
productSchema.index({ viewCount: -1 });

export default mango.model("ProductModel", productSchema, "products");
