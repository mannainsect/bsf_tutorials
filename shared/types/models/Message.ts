export interface Message {
  user_id: string
  user_name: string
  product_owner: boolean
  message: string
  created_at: string
}

export interface Conversation {
  _id: string
  product_id: string
  product_title: string
  conversation_type: string
  company_id: string
  company_name: string
  buyer_company_id: string
  buyer_company_name: string
  messages: Message[]
  created_at: string
  updated_at: string
}

export interface NewConversation {
  product_id: string
  product_title: string
  conversation_type: string
  message: string
}

export interface MessageRequest {
  conversation_id: string
  message: string
}

export interface ContactRequest {
  product_id: string
  company_id: string
  buyer_company_id: string
  product_owner: boolean
  message: string
}

export interface ConversationsRequest {
  limit?: number
  offset?: number
  conversation_type?: string
}

export interface MessagesRequest {
  conversation_id: string
  limit?: number
  offset?: number
}

export function isProductOwner(
  message: Message
): boolean {
  return message.product_owner === true
}

export function getLatestMessage(
  conversation: Conversation
): Message | undefined {
  if (!conversation.messages || conversation.messages.length === 0) {
    return undefined
  }
  return conversation.messages[conversation.messages.length - 1]
}

export function sortConversationsByDate(
  conversations: Conversation[]
): Conversation[] {
  return [...conversations].sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime()
    const dateB = new Date(b.updated_at).getTime()
    return dateB - dateA
  })
}