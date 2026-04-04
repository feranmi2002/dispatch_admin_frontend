import apiClient from '../lib/axios';
import type {
  ApiResponse,
  Dispatcher,
  DispatcherDetail,
  DispatcherFilters,
  DispatcherLocation,
  DispatcherStats,
  DocumentReviewAction,
  PaginatedResponse,
  Wallet,
  Delivery,
} from '../types';

export const dispatchersApi = {
  list: async (filters: DispatcherFilters = {}) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Dispatcher>>>(
      '/dispatchers',
      { params: filters }
    );
    return data;
  },

  getStats: async () => {
    const { data } = await apiClient.get<ApiResponse<DispatcherStats>>('/dispatchers/statistics');
    return data;
  },

  getLocations: async () => {
    const { data } = await apiClient.get<ApiResponse<DispatcherLocation[]>>('/dispatchers/locations');
    return data;
  },

  getOne: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<DispatcherDetail>>(`/dispatchers/${id}`);
    return data;
  },

  approve: async (id: number) => {
    const { data } = await apiClient.post<ApiResponse<Partial<Dispatcher>>>(`/dispatchers/${id}/approve`);
    return data;
  },

  suspend: async (id: number, reason?: string) => {
    const { data } = await apiClient.post<ApiResponse<Partial<Dispatcher>>>(
      `/dispatchers/${id}/suspend`,
      reason ? { reason } : {}
    );
    return data;
  },

  reviewDocument: async (
    dispatcherId: number,
    docId: number,
    action: DocumentReviewAction,
    reason?: string
  ) => {
    const { data } = await apiClient.post(
      `/dispatchers/${dispatcherId}/documents/${docId}/review`,
      { action, ...(reason ? { reason } : {}) }
    );
    return data;
  },

  reviewVehicleDocument: async (
    dispatcherId: number,
    docId: number,
    action: DocumentReviewAction,
    reason?: string
  ) => {
    const { data } = await apiClient.post(
      `/dispatchers/${dispatcherId}/vehicle-documents/${docId}/review`,
      { action, ...(reason ? { reason } : {}) }
    );
    return data;
  },

  getWallet: async (id: number, page = 1, perPage = 15) => {
    const { data } = await apiClient.get<ApiResponse<Wallet>>(`/dispatchers/${id}/wallet`, {
      params: { page, per_page: perPage },
    });
    return data;
  },

  creditWallet: async (id: number, amount: number, description: string) => {
    const { data } = await apiClient.post(`/dispatchers/${id}/wallet/credit`, {
      amount,
      description,
    });
    return data;
  },

  debitWallet: async (id: number, amount: number, description: string) => {
    const { data } = await apiClient.post(`/dispatchers/${id}/wallet/debit`, {
      amount,
      description,
    });
    return data;
  },

  getDeliveries: async (id: number, page = 1, perPage = 25) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Delivery>>>(
      `/dispatchers/${id}/deliveries`,
      { params: { page, per_page: perPage } }
    );
    return data;
  },
};
