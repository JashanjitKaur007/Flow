import { UploadedImage } from "../types/index.js";
import { prisma } from "../prisma/client.js";
import { imageQueue } from "../queues/image.queue.js";
import { redis } from "../redis/index.js";
import { DoctorType, Prisma } from "@prisma/client";
import { JobsOptions } from "bullmq";
import { getBufferAndType } from "../utils/index.js";
import sharp from "sharp";

export class DoctorClinicService {
  static createClinic = async (
    name: string,
    address: string | undefined,
    latitude: number,
    longitude: number,
    phone: string | undefined,
    email: string | undefined,
    website: string | undefined,
    description: string | undefined,
    logo: UploadedImage | string,
    images: UploadedImage | UploadedImage[] | string[],
    openingHours: { start: string; end: string } | undefined,
    type: DoctorType | undefined
  ) => {
    const clinic = await prisma.doctorClinic.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        phone,
        email,
        website,
        description,
        openingHours,
        type,
      },
    });

    const defaultJobOptions: JobsOptions = {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    };

    const { buffer: logoBuffer, type: logoType } = await getBufferAndType(logo);
    const smallLogoBuffer = await sharp(logoBuffer)
      .resize(1024, 1024, { fit: "inside" })
      .jpeg({ quality: 70 })
      .toBuffer();

    await imageQueue.add(
      "clinic-logo-upload",
      {
        clinicId: clinic.id,
        image: smallLogoBuffer,
        type: "jpeg",
      },
      defaultJobOptions
    );

    const imgs = Array.isArray(images) ? images : [images];
    await imageQueue.addBulk(
      await Promise.all(
        imgs.map(async (img) => {
          const { buffer: imageBuffer, type: imageType } =
            await getBufferAndType(img);
          const smallImageBuffer = await sharp(imageBuffer)
            .resize(1024, 1024, { fit: "inside" })
            .jpeg({ quality: 70 })
            .toBuffer();
          return {
            name: "clinic-images-upload",
            data: {
              clinicId: clinic.id,
              image: smallImageBuffer,
              type: "jpeg",
            },
            opts: defaultJobOptions,
          };
        })
      )
    );

    const stream = redis.scanStream({ match: "clinics:*" });
    stream.on("data", (keys: string[]) => {
      if (keys.length) redis.unlink(...keys);
    });
    stream.on("end", () => {
      redis.del("all-clinics");
    });

    return clinic;
  };

  static getClinics = async (
    latitude: number | undefined,
    longitude: number | undefined,
    radius: number | undefined,
    page: number = 1,
    limit: number = 10,
    query: string | undefined,
    type: DoctorType | undefined
  ) => {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    if (
      latitude !== undefined &&
      longitude !== undefined &&
      radius !== undefined
    ) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const rad = Number(radius);

      const cacheKey = `clinics:geo:lat=${lat}:lng=${lng}:r=${rad}:p=${page}:l=${limit}:q=${
        query ?? ""
      }:t=${type ?? ""}`;
      const cachedClinics = await redis.get(cacheKey);
      if (cachedClinics) {
        return JSON.parse(cachedClinics);
      }

      const conditions: Prisma.Sql[] = [
        Prisma.sql`"isActive" = true`,
        Prisma.sql`6371 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(${lat})) *
            cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) *
            sin(radians(latitude))
          ))
        ) < ${rad}`,
      ];

      if (query) {
        conditions.push(Prisma.sql`name ILIKE ${`%${query}%`}`);
      }

      if (type) {
        conditions.push(Prisma.sql`type::text = ${type}`);
      }

      const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

      const [clinics, countResult] = await Promise.all([
        prisma.$queryRaw`
          SELECT 
            id, 
            name, 
            address, 
            latitude, 
            longitude, 
            phone, 
            email, 
            website, 
            description, 
            logo, 
            images, 
            type,
            "isActive", 
            "createdAt", 
            "updatedAt",
            6371 * acos(
              LEAST(1, GREATEST(-1,
                cos(radians(${lat})) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) *
                sin(radians(latitude))
              ))
            ) AS distance_km
          FROM "DoctorClinic"
          ${whereClause}
          ORDER BY distance_km ASC
          OFFSET ${offset}
          LIMIT ${limitNumber};
        `,
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::int as count
          FROM "DoctorClinic"å
          ${whereClause};
        `,
      ]);

      const totalCount = Number(countResult[0].count);
      const totalPages = Math.ceil(totalCount / limitNumber);

      const response = {
        clinics,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          totalCount,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
        },
      };

      await redis.set(cacheKey, JSON.stringify(response), "EX", 60 * 15);
      return response;
    }

    const cacheKey = `clinics:page=${page}:limit=${limit}:query=${
      query ?? ""
    }:type=${type ?? ""}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const where = {
      isActive: true,
      ...(query
        ? { name: { contains: query, mode: "insensitive" as const } }
        : {}),
      ...(type ? { type } : {}),
    };
    const [allClinics, totalCount] = await Promise.all([
      prisma.doctorClinic.findMany({
        where,
        skip: offset,
        take: limitNumber,
        orderBy: { createdAt: "desc" },
      }),
      prisma.doctorClinic.count({ where }),
    ]);
    const totalPages = Math.ceil(totalCount / limitNumber);
    const response = {
      clinics: allClinics,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalCount,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 60 * 15);

    return response;
  };

  static getClinic = async (clinicId: string) => {
    const cachedClinic = await redis.get(`clinic:${clinicId}`);
    if (cachedClinic) {
      return JSON.parse(cachedClinic);
    }
    const clinic = await prisma.doctorClinic.findUnique({
      where: {
        id: clinicId,
      },
    });
    if (!clinic) {
      throw new Error("Clinic not found.");
    }
    await redis.set(
      `clinic:${clinicId}`,
      JSON.stringify(clinic),
      "EX",
      60 * 60 * 24
    );
    return clinic;
  };

  static createClinicStaff = async (clinicId: string, email: string) => {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const clinic = await tx.doctorClinic.findUnique({
        where: { id: clinicId },
        select: { id: true },
      });

      if (!clinic) {
        throw new Error("Clinic not found. Please choose a valid clinic.");
      }

      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, clinicId: true, role: true },
      });

      if (!user) {
        throw new Error("User not found. Please choose a valid user.");
      }

      if (user.role === "ADMIN") {
        throw new Error("Admin cannot be added as a staff member.");
      }

      if (user.clinicId) {
        throw new Error(
          "User already assigned as a staff member in another clinic. Please choose a different user."
        );
      }

      await tx.user.update({
        where: { id: user.id },
        data: { clinicId: clinic.id, role: "STAFF" },
      });
    });
    await redis.del(`clinic-staff-members:${clinicId}`);
  };

  static getClinicStaffMembers = async (clinicId: string) => {
    const cachedStaffMembers = await redis.get(
      `clinic-staff-members:${clinicId}`
    );
    if (cachedStaffMembers) {
      return JSON.parse(cachedStaffMembers);
    }
    const staffMembers = await prisma.user.findMany({
      where: { clinicId, role: "STAFF" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePicture: true,
        createdAt: true,
      },
    });
    await redis.set(
      `clinic-staff-members:${clinicId}`,
      JSON.stringify(staffMembers),
      "EX",
      60 * 60 * 24
    );
    return staffMembers;
  };

  static updateDoctorClinic = async (
    clinicId: string,
    name: string | undefined,
    address: string | undefined,
    latitude: number | undefined,
    longitude: number | undefined,
    phone: string | undefined,
    email: string | undefined,
    website: string | undefined,
    description: string | undefined,
    openingHours: { start: string; end: string } | undefined,
    type: DoctorType | undefined
  ) => {
    await prisma.doctorClinic.update({
      where: { id: clinicId },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(description !== undefined && { description }),
        ...(openingHours !== undefined && { openingHours }),
        ...(type !== undefined && { type }),
      },
    });
    const stream = redis.scanStream({ match: "clinics:*" });
    stream.on("data", (keys: string[]) => {
      if (keys.length) redis.unlink(...keys);
    });
    stream.on("end", () => {
      redis.del("all-clinics");
    });
    await redis.del(`clinic:${clinicId}`);
  };
}
