import "dotenv/config";

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, "\n"),
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
};
