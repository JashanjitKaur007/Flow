import { prisma } from "../prisma/client.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/token.util.js";
import { redis } from "../redis/index.js";
import { ImageType, UploadedImage } from "../types/index.js";
import { getBufferAndType } from "../utils/index.js";
import sharp from "sharp";
import { uploadImage } from "../utils/cloudinary.uploader.js";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  static register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        profilePicture: `https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
      },
    });
  };

  static login = async (
    email: string,
    password: string,
    userAgent: string | undefined,
    ipAddress: string | undefined
  ) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        role: true,
        clinicId: true,
        isActive: true,
        password: true,
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is disabled");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      clinicId: user.clinicId,
      profilePicture: user.profilePicture,
    };

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      type: "access",
    });

    const refreshToken = generateRefreshToken();

    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      user: {
        ...userData,
      },
      accessToken,
      refreshToken,
    };
  };

  static revokePreviousSessions = async (userId: string) => {
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  };

  static createSession = async (
    userId: string,
    refreshToken: string,
    userAgent: string | undefined,
    ipAddress: string | undefined
  ) => {
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + SEVEN_DAYS);
    await prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  };

  static logout = async (refreshToken: string) => {
    const refreshTokenHash = hashToken(refreshToken);
    await prisma.session.update({
      where: { refreshTokenHash },
      data: {
        isRevoked: true,
      },
    });
  };

  static getProfile = async (userId: string) => {
    const cachedProfile = await redis.get(`user:${userId}`);
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        role: true,
        clinicId: true,
        createdAt: true,
      },
    });
    await redis.set(
      `user:${userId}`,
      JSON.stringify(profile),
      "EX",
      60 * 60 * 24
    );
    return profile;
  };

  static refreshToken = async (
    refreshToken: string,
    userAgent: string | undefined,
    ipAddress: string | undefined
  ) => {
    const refreshTokenHash = hashToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + SEVEN_DAYS);

    await prisma.$transaction([
      prisma.session.create({
        data: {
          userId: session.user.id,
          refreshTokenHash: newRefreshTokenHash,
          userAgent,
          ipAddress,
          expiresAt,
        },
      }),
      prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      }),
    ]);

    const accessToken = generateAccessToken({
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      type: "access",
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  };

  static updateProfile = async (
    userId: string,
    firstName: string | undefined,
    lastName: string | undefined,
    profilePicture: UploadedImage | string | undefined | null
  ) => {
    let smallProfilePictureBuffer = undefined;

    if (profilePicture != null) {
      const { buffer } = await getBufferAndType(profilePicture);
      smallProfilePictureBuffer = await sharp(buffer)
        .resize(1024, 1024, { fit: "inside" })
        .jpeg({ quality: 70 })
        .toBuffer();
    }

    const uploadedProfilePicture =
      smallProfilePictureBuffer != null
        ? await uploadImage(smallProfilePictureBuffer)
        : undefined;

    const userProfileData = {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(profilePicture ? { profilePicture: uploadedProfilePicture } : {}),
    };

    await redis.del(`user:${userId}`);

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...userProfileData,
      },
    });
  };

  static updatePassword = async (
    userId: string,
    oldPassword: string,
    newPassword: string
  ) => {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new Error("User not found");
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid old password");
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    });
  };
}
