import { Request } from "express";
import { UploadedImage } from "../types";
import fs from "node:fs/promises";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const getClientIp = (req: Request): string | undefined => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress;
};

export const getClinicCacheKey = (
  latitude: number,
  longitude: number,
  radius: number,
  limit: number
) => {
  const latBucketSize = radius / 111;
  const latBucket = Math.floor(latitude / latBucketSize);

  const lngBucketSize = radius / (111 * Math.cos((latitude * Math.PI) / 180));
  const lngBucket = Math.floor(longitude / lngBucketSize);

  return `nearby_clinics:${latBucket}:${lngBucket}:${radius}:${limit}`;
};

const EASTERN_TIMEZONE = "America/New_York";

/**
 * Gets today's date in America/New_York timezone (EST/EDT), stored as UTC
 * Returns a Date object representing midnight of today in Eastern Time (stored as UTC)
 * Handles DST automatically (EST = UTC-5, EDT = UTC-4)
 *
 * Note: new Date() always returns UTC time regardless of server location (Render uses UTC).
 * This function converts to Eastern Time, accounting for DST automatically using date-fns-tz.
 */
export const getTodayInEST = (): Date => {
  const now = new Date();

  // Get current date in Eastern Time
  const etNow = toZonedTime(now, EASTERN_TIMEZONE);

  // Create midnight in Eastern Time (year, month, day from ET, time = 00:00:00)
  const etMidnight = new Date(
    etNow.getFullYear(),
    etNow.getMonth(),
    etNow.getDate(),
    0,
    0,
    0,
    0
  );

  // Convert midnight ET to UTC
  // This gives us the UTC timestamp representing midnight in Eastern Time
  return fromZonedTime(etMidnight, EASTERN_TIMEZONE);
};

/**
 * Creates a Date object for a specific time today in Eastern Time, stored as UTC
 * @param time - Time string in format "HH:mm" (e.g., "09:00" for 9 AM)
 * @returns Date object in UTC representing the specified time in Eastern Time
 */
export const todayWithTime = (time: string) => {
  const now = new Date();

  // Get current date in Eastern Time
  const etNow = toZonedTime(now, EASTERN_TIMEZONE);

  // Parse the time string
  const [hours, minutes] = time.split(":").map(Number);

  // Create date with the specified time in Eastern Time
  const etDateTime = new Date(
    etNow.getFullYear(),
    etNow.getMonth(),
    etNow.getDate(),
    hours,
    minutes,
    0,
    0
  );

  // Convert to UTC
  return fromZonedTime(etDateTime, EASTERN_TIMEZONE);
};

export const getBufferAndType = async (
  input: UploadedImage | string
): Promise<{ buffer: Buffer; type: string }> => {
  let buffer: Buffer;

  if (typeof input === "string") {
    const base64Data = input.replace(/^data:image\/\w+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  } else {
    buffer = await fs.readFile(input.tempFilePath);
  }

  const FileType = await import("file-type");
  const detected = await FileType.fileTypeFromBuffer(buffer);
  const type = detected?.ext || "jpeg";
  return { buffer, type };
};
