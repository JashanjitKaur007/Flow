import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/dotenv.config.js";

cloudinary.config({
  secure: true,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
});

export const uploadImage = async (image: Buffer, type = "jpeg") => {
  const base64 = image.toString("base64");
  const uploadInput = `data:image/${type};base64,${base64}`;
  const result = await cloudinary.uploader.upload(uploadInput, {
    resource_type: "image",
  });
  return result.secure_url;
};
