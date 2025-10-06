/**
 * Minimal Test Setup
 * Provides the bare minimum mocks needed for tests to run
 * Tests should import and test real implementations where possible
 */

import { vi, beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'

// Import Vue and Pinia for global use
import {
  ref,
  computed,
  reactive,
  readonly,
  watch,
  watchEffect,
  nextTick,
  toRef,
  toRefs,
  shallowRef
} from 'vue'
import {
  defineStore,
  createPinia,
  setActivePinia,
  getActivePinia,
  storeToRefs
} from 'pinia'
import { ionicStubs } from './ionic-stubs'

// Mock browser APIs that don't exist in jsdom
if (!globalThis.global) {
  globalThis.global = globalThis
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}
global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0))
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock localStorage with working implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      const newStore: Record<string, string> = {}
      Object.keys(store).forEach(k => {
        if (k !== key) {
          newStore[k] = store[k]
        }
      })
      store = newStore
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(store).length
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      const newStore: Record<string, string> = {}
      Object.keys(store).forEach(k => {
        if (k !== key) {
          newStore[k] = store[k]
        }
      })
      store = newStore
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(store).length
    }
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
})

// Make Vue functions globally available (as Nuxt auto-imports them)
global.ref = ref
global.computed = computed
global.reactive = reactive
global.readonly = readonly
global.watch = watch
global.watchEffect = watchEffect
global.nextTick = nextTick
global.toRef = toRef
global.toRefs = toRefs
global.shallowRef = shallowRef

// Make Pinia functions globally available
global.defineStore = defineStore
global.createPinia = createPinia
global.setActivePinia = setActivePinia
global.getActivePinia = getActivePinia
global.storeToRefs = storeToRefs

// Mock Nuxt composables with sensible defaults
global.useState = vi.fn((_key, init) => {
  return ref(init ? init() : null)
})

global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:8000/api/v1',
    domainAlias: 'bsfmarket'
  }
}))

global.useCookie = vi.fn(_name => {
  return ref(null)
})

global.useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
  currentRoute: ref({ path: '/', name: 'index' })
}))

global.useRoute = vi.fn(() => ({
  path: '/',
  params: {},
  query: {},
  name: 'index'
}))

global.navigateTo = vi.fn()

// Mock $fetch for API calls - this MUST be mocked to avoid real HTTP calls
global.$fetch = vi.fn((_url, _options) => {
  return Promise.resolve({})
})

// Create a simple useStorage composable that uses localStorage
global.useStorage = () => ({
  get: (key: string) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  },
  set: (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove: (key: string) => {
    localStorage.removeItem(key)
  },
  clear: () => {
    localStorage.clear()
  }
})

// Create useAuthStore that will be available globally
// This is a simplified version for testing
global.useAuthStore = () => {
  // Return a mock store for now, tests can override as needed
  return {
    user: ref(null),
    token: ref(null),
    isAuthenticated: computed(() => false),
    setUser: vi.fn(),
    setToken: vi.fn(),
    logout: vi.fn(),
    $patch: vi.fn(),
    $reset: vi.fn(),
    $subscribe: vi.fn()
  }
}

// Create useAuthService that returns mock functions
global.useAuthService = () => ({
  login: vi.fn(() =>
    Promise.resolve({
      token: 'test-token',
      user: { id: 1, email: 'test@example.com' }
    })
  ),
  logout: vi.fn(() => Promise.resolve()),
  register: vi.fn(() =>
    Promise.resolve({
      token: 'test-token',
      user: { id: 1, email: 'test@example.com' }
    })
  ),
  getProfile: vi.fn(() =>
    Promise.resolve({ id: 1, email: 'test@example.com' })
  ),
  sendPasswordReset: vi.fn(() => Promise.resolve()),
  verifyEmail: vi.fn(() => Promise.resolve())
})

// Create useAuth composable that uses the mocked services
global.useAuth = () => {
  const authService = useAuthService()
  const authStore = useAuthStore()

  return {
    login: authService.login,
    logout: authService.logout,
    register: authService.register,
    sendPasswordReset: authService.sendPasswordReset,
    verifyEmail: authService.verifyEmail,
    setToken: authStore.setToken,
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated)
  }
}

// Configure Vue Test Utils
config.global.stubs = {
  ...ionicStubs,
  NuxtLink: {
    template: '<a><slot /></a>',
    props: ['to']
  },
  NuxtPage: {
    template: '<div><slot /></div>'
  },
  NuxtLayout: {
    template: '<div><slot /></div>'
  },
  ClientOnly: {
    template: '<div><slot /></div>'
  },
  Teleport: {
    template: '<div><slot /></div>',
    props: ['to']
  }
}

// Setup Pinia for each test
beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})

// Mock useApi composable
global.useApi = () => ({
  api: vi.fn((_endpoint: string, _config?: unknown) => {
    return Promise.resolve({})
  })
})

// Mock useApiEndpoints composable
global.useApiEndpoints = () => ({
  auth: '/auth',
  users: '/users'
})

// Mock useIcons composable
global.useIcons = () => ({
  mail: 'mail-icon',
  phone: 'phone-icon',
  search: 'search-icon',
  home: 'home-icon',
  menu: 'menu-icon',
  close: 'close-icon',
  closeCircle: 'close-circle-icon',
  add: 'add-icon',
  addCircle: 'add-circle-icon',
  remove: 'remove-icon',
  success: 'success-icon',
  warning: 'warning-icon',
  error: 'error-icon',
  alertCircle: 'alert-circle-icon',
  info: 'info-icon',
  forward: 'forward-icon',
  back: 'back-icon',
  arrowBack: 'arrow-back-icon',
  eye: 'eye-icon',
  eyeOff: 'eye-off-icon',
  lock: 'lock-icon',
  mobile: 'mobile-icon',
  fast: 'fast-icon',
  secure: 'secure-icon',
  wallet: 'wallet-icon',
  business: 'business-icon',
  businessOutline: 'business-outline-icon',
  calendar: 'calendar-icon',
  create: 'create-icon',
  person: 'person-icon',
  documents: 'documents-icon',
  chatbubble: 'chatbubble-icon',
  chatbubbles: 'chatbubbles-icon',
  send: 'send-icon',
  filter: 'filter-icon',
  sort: 'sort-icon',
  layers: 'layers-icon',
  options: 'options-icon',
  helpCircleOutline: 'help-circle-outline-icon',
  helpCircle: 'help-circle-icon',
  language: 'language-icon',
  linkOutline: 'link-outline-icon',
  codeSlash: 'code-slash-icon',
  logout: 'logout-icon',
  searchOutline: 'search-outline-icon'
})

// Mock useToast composable
global.useToast = () => ({
  create: vi.fn(() => Promise.resolve({ present: vi.fn() })),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn()
})

// Mock useProfile composable
global.useProfile = () => ({
  user: computed(() => null),
  activeCompany: computed(() => null),
  otherCompanies: computed(() => []),
  userId: computed(() => null),
  companyId: computed(() => null),
  userEmail: computed(() => null),
  userCredits: computed(() => 0),
  loading: ref(false),
  error: ref(null),
  hasProfileData: computed(() => false),
  refreshProfile: vi.fn(),
  switchCompany: vi.fn(),
  ensureProfileData: vi.fn(),
  fetchProfile: vi.fn(),
  profile: computed(() => null)
})

// Mock useUserRole composable
global.useUserRole = () => ({
  isCompanyAdmin: vi.fn(() => false),
  isCompanyManager: vi.fn(() => false),
  isCompanyOperator: vi.fn(() => false),
  hasAnyRole: vi.fn(() => false),
  getUserRole: vi.fn(() => null)
})

// Mock useI18n composable
global.useI18n = () => ({
  t: (key: string) => key,
  locale: ref('en'),
  locales: ref(['en', 'es']),
  setLocale: vi.fn()
})

// Mock useLocalePath composable
global.useLocalePath = () => (path: string) => path

// Mock useErrorHandler composable
global.useErrorHandler = () => ({
  normalizeError: vi.fn(error => error),
  handleError: vi.fn(error => error),
  handleApiError: vi.fn(error => error),
  handleValidationError: vi.fn(error => error),
  handleSilentError: vi.fn(error => error)
})

// Export utilities
export const flushPromises = () => new Promise(process.nextTick)
