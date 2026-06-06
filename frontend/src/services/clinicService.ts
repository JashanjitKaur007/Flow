import { AxiosError } from "axios";
import {
  ApiResponse,
  Clinic,
  ClinicsResponse,
  GetClinicsQuery,
  Queue,
} from "../models/types";
import api from "./api";

// ============================================
// CLINIC SERVICE
// ============================================
export const ClinicService = {
  /**
   * Get clinics with optional geo-filtering and pagination
   * Uses query parameters as per API documentation
   */
  getClinics: async (
    params: GetClinicsQuery
  ): Promise<{
    clinics: Clinic[];
    pagination?: ClinicsResponse["data"]["pagination"];
  }> => {
    try {
      console.log("=== ClinicService.getClinics ===");
      console.log("Query params:", JSON.stringify(params, null, 2));

      // Use GET with query params as documented
      const response = await api.get<ClinicsResponse>("/clinic", { params });

      if (response.data.success) {
        console.log(`Response: ${response.data.data.clinics.length} clinics`);
        return {
          clinics: response.data.data.clinics,
          pagination: response.data.data.pagination,
        };
      }

      console.log("Response: success=false");
      return { clinics: [] };
    } catch (error: any) {
      console.error(
        "Failed to fetch clinics:",
        error?.response?.status,
        error?.response?.data || error.message
      );
      return { clinics: [] };
    }
  },

  /**
   * Get all clinics without location filter
   */
  getAllClinics: async (
    page: number = 1,
    limit: number = 10
  ): Promise<Clinic[]> => {
    try {
      console.log("=== ClinicService.getAllClinics ===");
      console.log(`Fetching all clinics - page: ${page}, limit: ${limit}`);

      const response = await api.get<ClinicsResponse>("/clinic", {
        params: { page, limit },
      });

      if (response.data.success) {
        console.log(`Response: ${response.data.data.clinics.length} clinics`);
        return response.data.data.clinics;
      }

      return [];
    } catch (error: any) {
      console.error(
        "Failed to fetch all clinics:",
        error?.response?.status,
        error?.response?.data || error.message
      );
      return [];
    }
  },

  /**
   * Get nearby clinics based on user location
   */
  getNearbyClinics: async (
    latitude: number,
    longitude: number,
    radius: number = 10,
    page: number = 1,
    limit: number = 10
  ): Promise<Clinic[]> => {
    try {
      console.log("=== ClinicService.getNearbyClinics ===");
      console.log(`User Location: lat=${latitude}, lng=${longitude}`);
      console.log(`Requested Radius: ${radius}km`);

      const response = await api.get<ClinicsResponse>("/clinic", {
        params: { latitude, longitude, radius, page, limit },
      });

      if (response.data.success) {
        const clinics = response.data.data.clinics;
        console.log(`API returned ${clinics.length} clinics:`);

        clinics.forEach((clinic, index) => {
          console.log(
            `  ${index + 1}. ${clinic.name} - ${
              clinic.distance_km?.toFixed(2) || "?"
            } km`
          );
        });

        const outsideRadius = clinics.filter(
          (c) => c.distance_km && c.distance_km > radius
        );
        if (outsideRadius.length > 0) {
          console.warn(
            `⚠️ ${outsideRadius.length} clinics are OUTSIDE the ${radius}km radius!`
          );
        }

        return clinics;
      }

      console.log("Response: success=false");
      return [];
    } catch (error: any) {
      console.error(
        "Failed to fetch nearby clinics:",
        error?.response?.status,
        error?.response?.data || error.message
      );
      return [];
    }
  },

  /**
   * Get clinic by ID
   */
  getClinicById: async (clinicId: string): Promise<Clinic | null> => {
    try {
      const response = await api.get<ApiResponse<Clinic>>(
        `/clinic/${clinicId}`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error("Failed to fetch clinic details:", error);
      return null;
    }
  },

  /**
   * Search clinics by name
   */
  searchClinics: async (
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Clinic[]> => {
    try {
      const response = await api.get<ClinicsResponse>("/clinic", {
        params: { query, page, limit },
      });

      if (response.data.success) {
        return response.data.data.clinics;
      }

      return [];
    } catch (error) {
      console.error("Failed to search clinics:", error);
      return [];
    }
  },

  /**
   * Get today's queue for a clinic
   */
  getClinicQueue: async (clinicId: string): Promise<Queue | null> => {
    try {
      const response = await api.get<ApiResponse<Queue>>(
        `/queues/clinic/${clinicId}/today`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return null;
      }
      return null;
    }
  },

  /**
   * Update clinic details
   */
  updateClinic: async (
    clinicId: string,
    data: any
  ): Promise<{ success: boolean; message?: string; data?: Clinic }> => {
    try {
      const response = await api.patch<ApiResponse<Clinic>>(
        `/clinic/${clinicId}`,
        data
      );

      if (response.data.success) {
        return {
          success: true,
          message: "Clinic updated successfully",
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update clinic",
      };
    } catch (error: any) {
      console.error("Failed to update clinic:", error);
      return {
        success: false,
        message: error?.response?.data?.message || "Failed to update clinic",
      };
    }
  },

  /**
   * Create a new doctor clinic
   */
  createDoctorClinic: async (
    data: FormData
  ): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
      const response = await api.post<ApiResponse<any>>(`/clinic`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || "Clinic created successfully",
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update clinic",
      };
    } catch (error: any) {
      console.error("Failed to update clinic:", error);
      return {
        success: false,
        message: error?.response?.data?.message || "Failed to update clinic",
      };
    }
  },

  /**
   * Add staff to clinic
   */
  addStaff: async (
    clinicId: string,
    email: string
  ): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
      console.log("=== ClinicService.addStaff ===");
      console.log(`Adding staff to clinic: ${clinicId}`);
      console.log(`Email: ${email}`);
      const response = await api.post<ApiResponse<any>>(
        `/clinic/${clinicId}/staff`,
        { email }
      );
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || "Staff added successfully",
          data: response.data.data,
        };
      }
      return {
        success: false,
        message: response.data.message || "Failed to add staff",
      };
    } catch (error: any) {
      console.log("Failed to add staff:", error);
      return {
        success: false,
        message: error?.response?.data?.message || "Failed to add staff",
      };
    }
  },
};

// ============================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================
export const getNearbyClinics = async (
  params: GetClinicsQuery
): Promise<Clinic[]> => {
  const result = await ClinicService.getClinics(params);
  return result.clinics;
};

export const getClinicDetails = async (clinicId: string): Promise<Clinic> => {
  const clinic = await ClinicService.getClinicById(clinicId);
  if (!clinic) {
    throw new Error("Clinic not found");
  }
  return clinic;
};

export default ClinicService;
