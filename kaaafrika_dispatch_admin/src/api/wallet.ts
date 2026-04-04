import apiClient from '../lib/axios';
import type { ApiResponse, PaginatedResponse, WalletTransaction } from '../types';

export const walletApi = {
  getTransactions: async (page = 1, perPage = 25) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<WalletTransaction>>>('/wallet-transactions', {
      params: { page, per_page: perPage }
    });
    return data;
  }
};
