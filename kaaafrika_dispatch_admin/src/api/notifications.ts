import apiClient from '../lib/axios';
import type { ApiResponse } from '../types';

export interface SendNotificationPayload {
  user_id: number;
  title: string;
  body: string;
}

export const notificationsApi = {
  sendToUser: async (payload: SendNotificationPayload) => {
    const { data } = await apiClient.post<ApiResponse<null>>('/notifications/send-to-user', payload);
    return data;
  },
};
