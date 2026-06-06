import { AxiosError } from "axios";
import {
  ApiError,
  AuthResponse,
  DeviceInfo,
  LoginInput,
  RegisterInput,
  User,
} from "../models/types";
import api, { TokenManager } from "./api";

// ============================================
// AUTH SERVICE
// ============================================
export const AuthService = {
  /**
   * Register a new user
   */
  register: async (
    data: RegisterInput
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", data);

      if (response.data.success) {
        return { success: true, message: response.data.message };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || "Registration failed";
      return { success: false, message };
    }
  },

  /**
   * Login user
   */
  login: async (
    data: LoginInput,
    deviceInfo?: DeviceInfo
  ): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", {
        ...data,
        deviceInfo: deviceInfo || { userAgent: "flowClinics-Mobile-App" },
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        await TokenManager.setTokens(accessToken, refreshToken);
        return { success: true, user };
      }

      return { success: false, message: "Login failed" };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || "Invalid credentials";
      return { success: false, message };
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      // Silent fail - we still want to clear local tokens
      console.warn("Logout API call failed:", error);
    } finally {
      await TokenManager.clearTokens();
    }
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<User | null> => {
    try {
      const response = await api.get<{ success: boolean; data: User }>(
        "/auth/me"
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: {
    firstName: string;
    lastName: string;
    profilePicture?: string; // base64 string
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);

      // Only append image if provided (as base64 string)
      if (data.profilePicture) {
        // Remove data:image/... prefix if present, keep just base64
        const base64Data = data.profilePicture.includes(",")
          ? data.profilePicture.split(",")[1]
          : data.profilePicture;
        formData.append("profilePicture", base64Data);
      }

      const response = await api.put<{
        success: boolean;
        message?: string;
      }>("/auth/me", formData);

      if (response.data.success) {
        return { success: true, message: response.data.message };
      }

      return {
        success: false,
        message: response.data.message || "Update failed",
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || "Failed to update profile";
      return { success: false, message };
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    return TokenManager.hasTokens();
  },

  /**
   * Update user password
   */
  updatePassword: async (data: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.put<{
        success: boolean;
        message?: string;
      }>("/auth/update-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });

      if (response.data.success) {
        return { success: true, message: response.data.message };
      }

      return {
        success: false,
        message: response.data.message || "Password update failed",
      };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || "Failed to update password";
      return { success: false, message };
    }
  },

  /**
   * Refresh the access token
   */
  refreshToken: async (): Promise<boolean> => {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await api.post<AuthResponse>("/auth/refresh-token", {
        refreshToken,
        deviceInfo: { userAgent: "flowClinics-Mobile-App" },
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;
        await TokenManager.setTokens(accessToken, newRefreshToken);
        return true;
      }

      return false;
    } catch (error) {
      await TokenManager.clearTokens();
      return false;
    }
  },
};

export default AuthService;
