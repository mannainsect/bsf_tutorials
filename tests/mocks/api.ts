// API response mocks for testing

export const mockUser = {
  id: '123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  avatar: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export const mockAuthResponse = {
  user: mockUser,
  accessToken: 'mock-access-token-123',
  refreshToken: 'mock-refresh-token-456',
  expiresIn: 3600
}

// Mock API error responses
export const mockErrorResponse = {
  error: {
    code: 'AUTH_FAILED',
    message: 'Authentication failed',
    statusCode: 401
  }
}

export const mockValidationError = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    statusCode: 400,
    errors: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password is required' }
    ]
  }
}

// Mock API functions for testing
export const mockApiCalls = {
  login: async (credentials: any) => {
    if (credentials.email === 'test@example.com') {
      return { data: mockAuthResponse }
    }
    throw mockErrorResponse
  }
}

// Helper function to mock API delays
export const mockDelay = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}