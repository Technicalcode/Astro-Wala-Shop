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
