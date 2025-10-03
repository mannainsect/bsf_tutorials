import type { Conversation, Message } from '../models/Message'
import type { ApiResponse } from './common.types'

export interface ConversationsListResponse {
  conversations: Conversation[]
  total: number
  page: number
  limit: number
}

export interface ConversationDetailResponse {
  conversation: Conversation
}

export interface MessageSendResponse {
  message: Message
  conversation_id: string
}

export interface ContactProductResponse {
  conversation: Conversation
  message: string
}

export interface MessagesListResponse {
  messages: Message[]
  conversation_id: string
  total: number
  page: number
  limit: number
}

export interface ConversationCreateResponse {
  conversation: Conversation
  message: string
}

export type ConversationsApiResponse =
  ApiResponse<ConversationsListResponse>

export type ConversationApiResponse =
  ApiResponse<ConversationDetailResponse>

export type MessageApiResponse =
  ApiResponse<MessageSendResponse>

export type ContactApiResponse =
  ApiResponse<ContactProductResponse>

export type MessagesApiResponse =
  ApiResponse<MessagesListResponse>

export type CreateConversationApiResponse =
  ApiResponse<ConversationCreateResponse>