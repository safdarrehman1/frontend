import api from '../../lib/axios';
import { ApiResponse, Conversation } from '../../types';

export const fetchConversations = async (): Promise<Conversation[]> => {
  const res = await api.get<ApiResponse<{ conversations: Conversation[] }>>('/conversations');
  return res.data.data.conversations;
};

export const createDirectConversation = async (targetUserId: number): Promise<Conversation> => {
  const res = await api.post<ApiResponse<{ conversation: Conversation }>>('/conversations/direct', {
    targetUserId,
  });
  return res.data.data.conversation;
};