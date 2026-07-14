import sharp from "sharp";
import cloudinary, { assertCloudinaryConfig } from "../config/image.config.js";

const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });

export const slugify = (value = "image") => {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  return slug || "image";
};

export const saveImageAsset = async ({
  file,
  folder = "astro-images",
  name = "image",
  width = 500,
  height = 500,
  fit = "cover",
  quality = 80,
}) => {
  if (!file) return null;

  const slug = slugify(name);
  const assetId = `${slug}-${Date.now()}`;

  const processedImage = await sharp(file.buffer)
    .resize(width, height, { fit })
    .webp({ quality })
    .toBuffer();

  assertCloudinaryConfig();

  const cloudinaryResult = await uploadBufferToCloudinary(processedImage, {
    folder,
    public_id: assetId,
    resource_type: "image",
    format: "webp",
    overwrite: false,
  });

  if (!cloudinaryResult?.secure_url || !cloudinaryResult?.public_id) {
    throw new Error("Cloudinary upload completed without an image URL");
  }

  return {
    image: cloudinaryResult.secure_url,
    public_id: cloudinaryResult.public_id,
  };
};

export const deleteImageAsset = async (publicId) => {
  if (!publicId) return;

  try {
    assertCloudinaryConfig();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error("Cloudinary image cleanup failed:", error.message);
  }
};
