export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  is_online: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_url: string | null;
  file_name: string | null;
  is_edited: boolean;
  deleted_at: string | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    name: string;
    avatar_url: string | null;
  };
}

export interface Participant {
  id: number;
  conversation_id: number;
  user_id: number;
  is_admin: boolean;
  joined_at: string;
  user: User;
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name: string | null;
  created_by: number;
  participants: Participant[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
