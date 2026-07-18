import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    bg: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
    },
    title: {
      type: String,
      default: "",
    },
    titleColor: String,
    subtitle: String,
    subtitleColor: String,
    cta: String,
    ctaBg: String,
    ctaText: String,
    overlayOpacity: Number,
    alignment: String,
    to: {
      type: String,
      default: "/",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

BannerSchema.index({ isActive: 1, order: 1, createdAt: -1 });
BannerSchema.index({ order: 1, createdAt: -1 });

export default mongoose.model("Banner", BannerSchema);
