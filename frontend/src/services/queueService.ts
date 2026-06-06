import { ApiResponse, Queue, QueueStatus } from "../models/types";
import api from "./api";

// ============================================
// QUEUE SERVICE
// ============================================
export const QueueService = {
  /**
   * Initialize a daily queue for a clinic (Admin/Staff only)
   */
  initializeQueue: async (
    clinicId: string,
    maxQueueSize: number = 50
  ): Promise<Queue | null> => {
    try {
      const response = await api.post<ApiResponse<Queue>>(
        `/queues/init/${clinicId}`,
        { maxQueueSize }
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error("Failed to initialize queue:", error);
      throw error;
    }
  },

  /**
   * Get queue status by queue ID
   */
  getQueueStatus: async (queueId: string): Promise<QueueStatus | null> => {
    try {
      const response = await api.get<ApiResponse<QueueStatus>>(
        `/queues/${queueId}/status`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error("Failed to fetch queue status:", error);
      throw error;
    }
  },

  /**
   * Get today's queue for a specific clinic
   */
  getTodayQueueForClinic: async (clinicId: string): Promise<Queue | null> => {
    try {
      const response = await api.get<ApiResponse<Queue>>(`/queues/${clinicId}`);

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      // Return null if no queue exists for today
      return null;
    }
  },

  /**
   * Toggle queue status (start/pause) for a queue
   * PATCH /api/queues/:queueId/status
   */
  toggleQueueStatus: async (
    queueId: string,
    isActive: boolean
  ): Promise<Queue | null> => {
    try {
      const response = await api.patch<ApiResponse<Queue>>(
        `/queues/${queueId}/status`,
        { isActive }
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error("Failed to toggle queue status:", error);
      throw error;
    }
  },
};

export default QueueService;
