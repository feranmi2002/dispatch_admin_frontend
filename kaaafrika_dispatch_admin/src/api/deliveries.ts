import apiClient from '../lib/axios';
import type {
  ApiResponse,
  Delivery,
  DeliveryDetail,
  DeliveryFilters,
  DeliveryOtp,
  DeliveryStats,
  PayoutStatus,
  PaginatedResponse,
} from '../types';

export const deliveriesApi = {
  list: async (filters: DeliveryFilters = {}) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Delivery>>>(
      '/deliveries',
      { params: filters }
    );
    return data;
  },

  getOne: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<DeliveryDetail>>(`/deliveries/${id}`);
    return data;
  },

  getStats: async (period = 'week', dateFrom?: string, dateTo?: string) => {
    const { data } = await apiClient.get<ApiResponse<DeliveryStats>>('/deliveries/statistics', {
      params: { period, ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }) },
    });
    return data;
  },

  getOtp: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<DeliveryOtp>>(`/deliveries/${id}/otp`);
    return data;
  },

  confirm: async (id: number) => {
    const { data } = await apiClient.post(`/deliveries/${id}/confirm`);
    return data;
  },

  cancel: async (id: number, reason: string) => {
    const { data } = await apiClient.post(`/deliveries/${id}/cancel`, { reason });
    return data;
  },

  reassign: async (id: number, dispatcherId: number) => {
    const { data } = await apiClient.post(`/deliveries/${id}/reassign`, {
      dispatcher_id: dispatcherId,
    });
    return data;
  },

  updatePayoutStatus: async (id: number, payoutStatus: PayoutStatus) => {
    const { data } = await apiClient.patch(`/deliveries/${id}/payment`, {
      payout_status: payoutStatus,
    });
    return data;
  },
};
