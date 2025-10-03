import type {
  Conversation,
  ContactRequest,
  Message
} from '~/shared/types/models/Message'
import type {
  ConversationsListResponse,
  ContactProductResponse,
  MessageSendResponse
} from '~/shared/types/api/MessageResponses'

// Mock messages
export const mockMessages: Message[] = [
  {
    message: 'Hello, I am interested in this product',
    user_id: 'user-buyer-1',
    user_name: 'John Buyer',
    created_at: '2024-01-15T10:00:00Z',
    product_owner: false
  },
  {
    message: 'Thank you for your interest! The product is available.',
    user_id: 'user-seller-1',
    user_name: 'Jane Seller',
    created_at: '2024-01-15T10:30:00Z',
    product_owner: true
  },
  {
    message: 'What is the minimum order quantity?',
    user_id: 'user-buyer-2',
    user_name: 'Bob Buyer',
    created_at: '2024-01-15T11:00:00Z',
    product_owner: false
  },
  {
    message: 'The minimum order is 10 units.',
    user_id: 'user-seller-2',
    user_name: 'Alice Seller',
    created_at: '2024-01-15T11:15:00Z',
    product_owner: true
  }
]

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    _id: 'conv-1',
    product_id: 'product-123',
    product_title: 'Premium Electronics Component',
    conversation_type: 'product',
    company_id: 'test-company-123',
    company_name: 'Tech Solutions Inc.',
    buyer_company_id: 'buyer-company-1',
    buyer_company_name: 'Buyer Company One',
    messages: mockMessages.slice(0, 2),
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    _id: 'conv-2',
    product_id: 'product-456',
    product_title: 'Industrial Equipment Part',
    conversation_type: 'product',
    company_id: 'seller-company-2',
    company_name: 'Manufacturing Corp.',
    buyer_company_id: 'buyer-company-2',
    buyer_company_name: 'Buyer Company Two',
    messages: mockMessages.slice(2, 4),
    created_at: '2024-01-14T14:00:00Z',
    updated_at: '2024-01-15T11:15:00Z'
  },
  {
    _id: 'conv-3',
    product_id: 'product-789',
    product_title: 'Office Supplies Bundle',
    conversation_type: 'wanted',
    company_id: 'seller-company-3',
    company_name: 'Office Depot Co.',
    buyer_company_id: 'buyer-company-1',
    buyer_company_name: 'Buyer Company One',
    messages: [mockMessages[0]],
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z'
  }
]

// Mock empty conversation
export const mockEmptyConversation: Conversation = {
  _id: 'conv-empty',
  product_id: 'product-999',
  product_title: 'New Product',
  conversation_type: 'product',
  company_id: 'seller-company-4',
  company_name: 'New Vendor Ltd.',
  buyer_company_id: 'buyer-company-1',
  buyer_company_name: 'Buyer Company One',
  messages: [],
  created_at: '2024-01-16T12:00:00Z',
  updated_at: '2024-01-16T12:00:00Z'
}

// Mock contact request
export const mockContactRequest: ContactRequest = {
  product_id: 'product-123',
  company_id: 'test-company-123',
  buyer_company_id: 'buyer-company-1',
  product_owner: false,
  message: 'Hello, I am interested in your product.'
}

// Mock conversations list response
export const mockConversationsListResponse: ConversationsListResponse = {
  conversations: mockConversations,
  total: mockConversations.length,
  page: 1,
  limit: 100
}

// Mock empty conversations list response
export const mockEmptyConversationsListResponse: ConversationsListResponse = {
  conversations: [],
  total: 0,
  page: 1,
  limit: 100
}

// Mock contact product response
export const mockContactProductResponse: ContactProductResponse = {
  conversation: mockConversations[0],
  message: 'Message sent successfully'
}

// Mock message send response
export const mockMessageSendResponse: MessageSendResponse = {
  message: mockMessages[0],
  conversation_id: 'conv-1'
}

// Mock rate limit error
export const mockRateLimitError = {
  statusCode: 429,
  message: 'Too many requests. Please wait and try again.'
}

// Mock authentication error
export const mockAuthError = {
  statusCode: 401,
  message: 'Authentication required'
}

// Mock forbidden error
export const mockForbiddenError = {
  statusCode: 403,
  message: 'Access denied'
}

// Mock not found error
export const mockNotFoundError = {
  statusCode: 404,
  message: 'Conversation not found'
}

// Mock network error
export const mockNetworkError = new Error('Network error')

// Mock validation errors
export const mockValidationErrors = {
  emptyMessage: new Error('Message cannot be empty'),
  messageTooLong: new Error('Message exceeds 1000 characters'),
  missingProductId: new Error('Product ID is required'),
  missingConversationId: new Error('Conversation ID is required'),
  missingCompanyId: new Error('No company ID found in user profile')
}

// Helper function to create a long message
export const createLongMessage = (length: number): string => {
  return 'a'.repeat(length)
}

// Helper function to create XSS attack strings
export const xssTestStrings = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<input onfocus="alert(\'XSS\')" autofocus>'
]

// Helper function to create sanitized versions
export const sanitizedXssStrings = [
  '&lt;script&gt;alert("XSS")&lt;/script&gt;',
  '&lt;img src=x onerror="alert(\'XSS\')"&gt;',
  '&lt;svg onload="alert(\'XSS\')"&gt;',
  'javascript:alert("XSS")',
  '&lt;iframe src="javascript:alert(\'XSS\')"&gt;&lt;/iframe&gt;',
  '&lt;input onfocus="alert(\'XSS\')" autofocus&gt;'
]