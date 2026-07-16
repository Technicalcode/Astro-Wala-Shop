import mongoose from "mongoose";

const Categoty = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tagline: {
      type: String,
      required: true,
    },
    themecolor: {
      type: String,
      required: true,
      default: "#000000",
    },

    bestseller: {
      type: Boolean,
      default: false,
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

export default mongoose.model("Category", Categoty);

// name;
// tagline;

// themecolore;

// image;
