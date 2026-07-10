import api from '../../lib/axios';
import { ApiResponse, User } from '../../types';

export const fetchAllUsers = async (): Promise<User[]> => {
  const res = await api.get<ApiResponse<{ users: User[] }>>('/users');
  return res.data.data.users;
};