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
  read_at: string | null;
  reply_to_message_id: number | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    name: string;
    avatar_url: string | null;
    is_online: boolean;
  };
  replyTo?: {
    id: number;
    sender_id: number;
    content: string;
    message_type: 'text' | 'image' | 'file';
    file_name: string | null;
    deleted_at: string | null;
    sender: { id: number; name: string };
  } | null;
  reactions?: MessageReaction[];
  receipts?: MessageReceipt[];
  pins?: { id: number; pinned_by: number }[];
  stars?: { id: number; user_id: number }[];
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user: { id: number; name: string };
}

export interface MessageReceipt {
  user_id: number;
  delivered_at: string | null;
  seen_at: string | null;
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
