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

export const mockProducts = [
  {
    id: '1',
    title: 'Test Product 1',
    description: 'Description for test product 1',
    price: 99.99,
    category: 'electronics',
    images: ['/images/product1.jpg'],
    seller: {
      id: '456',
      name: 'Test Seller',
      rating: 4.5
    },
    stock: 10,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Test Product 2',
    description: 'Description for test product 2',
    price: 149.99,
    category: 'clothing',
    images: ['/images/product2.jpg'],
    seller: {
      id: '789',
      name: 'Another Seller',
      rating: 4.8
    },
    stock: 5,
    createdAt: '2024-01-02T00:00:00Z'
  }
]

export const mockCategories = [
  { id: '1', name: 'Electronics', slug: 'electronics', count: 150 },
  { id: '2', name: 'Clothing', slug: 'clothing', count: 230 },
  { id: '3', name: 'Books', slug: 'books', count: 89 },
  { id: '4', name: 'Home & Garden', slug: 'home-garden', count: 167 }
]

export const mockCart = {
  id: 'cart-123',
  items: [
    {
      id: 'item-1',
      product: mockProducts[0],
      quantity: 2,
      price: 99.99
    }
  ],
  subtotal: 199.98,
  tax: 20.00,
  shipping: 10.00,
  total: 229.98
}

export const mockOrder = {
  id: 'order-456',
  orderNumber: 'ORD-2024-001',
  status: 'pending',
  items: mockCart.items,
  shippingAddress: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TC',
    zipCode: '12345',
    country: 'Test Country'
  },
  billingAddress: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TC',
    zipCode: '12345',
    country: 'Test Country'
  },
  paymentMethod: 'credit_card',
  subtotal: 199.98,
  tax: 20.00,
  shipping: 10.00,
  total: 229.98,
  createdAt: '2024-01-03T00:00:00Z'
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
  },

  getProducts: async () => {
    return { data: mockProducts }
  },

  getProduct: async (id: string) => {
    const product = mockProducts.find(p => p.id === id)
    if (product) {
      return { data: product }
    }
    throw { error: { message: 'Product not found', statusCode: 404 } }
  },

  getCategories: async () => {
    return { data: mockCategories }
  },

  getCart: async () => {
    return { data: mockCart }
  },

  createOrder: async () => {
    return { data: mockOrder }
  }
}

// Helper function to mock API delays
export const mockDelay = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}