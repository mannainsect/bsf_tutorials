# BSF Marketplace Developer Guide

## 1. Executive Summary

### Core Technology Stack

| Layer      | Technology          | Purpose                         |
| ---------- | ------------------- | ------------------------------- |
| Framework  | Nuxt 4              | SSR/SSG with auto-imports       |
| UI         | Vue 3 + Ionic       | Cross-platform components       |
| Types      | TypeScript          | Strict type safety              |
| State      | Pinia               | Reactive state management       |
| Validation | Vee-Validate + Zod  | Schema-based validation         |
| Testing    | Vitest + Playwright | Unit and E2E testing            |
| i18n       | Nuxt I18n           | Multi-language (EN/ES/FR/PT/DE) |
| Mobile     | Capacitor           | iOS/Android deployment          |

### Architecture Philosophy

- **Single Responsibility**: Each module has one clear purpose
- **Type Safety First**: TypeScript strict mode throughout
- **Repository Pattern**: Clean data access separation
- **Service Layer**: Business logic abstraction
- **Composable Architecture**: Reusable reactive logic
- **Mobile-First Design**: Ionic components for consistency

## 2. Project Structure

### Essential Directories

```
app/
  components/         # Feature-based Vue components
    auth/            # Authentication components
    layout/          # Headers, footers, menus
    ui/base/         # BaseButton, BaseInput, BaseCard
    features/        # Feature-specific components
  composables/       # Business logic & state
    api/            # API integration layer
      repositories/ # Data access patterns
      services/     # Business operations
  layouts/          # Page layout templates
  middleware/       # Route guards & auth
  pages/            # File-based routing
  stores/           # Pinia state stores
server/            # API routes (Nitro)
shared/types/      # TypeScript definitions
  api/            # Request/response types
  models/         # Domain models
tests/            # Test infrastructure
i18n/locales/     # Translation files
```

### Naming Conventions

| Type           | Pattern           | Example               |
| -------------- | ----------------- | --------------------- |
| Component      | PascalCase        | `AuthLoginForm.vue`   |
| Composable     | use prefix        | `useAuth.ts`          |
| Store          | use prefix        | `useAuthStore.ts`     |
| Repository     | Repository suffix | `UserRepository.ts`   |
| Service        | Service suffix    | `AuthService.ts`      |
| Type/Interface | PascalCase        | `User`, `ApiResponse` |

### Auto-Import Resolution

- `components/auth/LoginForm.vue` → `<AuthLoginForm />`
- `components/ui/base/Button.vue` → `<UiBaseButton />`
- Composables and stores auto-imported globally

## 3. Critical Development Rules

### NEVER DO

- Create headers/footers in pages (handled by layouts)
- Use `ion-page` or `ion-content` in pages
- Hardcode text (always use i18n)
- Import Ionic icons directly (use `useIcons()`)
- Make API calls in components (use composables)
- Navigate without `localePath()`
- Add comments unless explicitly requested

### ALWAYS DO

- Use Ionic components for ALL UI elements
- Apply `localePath()` to every navigation path
- Use `$t()` for all user-facing text
- Implement loading and error states
- Use TypeScript strict mode
- Handle auth token expiration

## 4. Development Standards

### Layout System Architecture

**Automatic Layout Selection** - Global middleware assigns layouts based on
auth state:

- Authenticated → `private` layout
- Unauthenticated → `public` layout
- No manual layout configuration needed in pages

**Page Structure Requirements**:

- Pages must use simple `<div>` wrapper
- NO `ion-page`, `ion-content`, `ion-header`, `ion-footer`
- Optional: `ion-toolbar` for page-specific navigation
- Layouts provide the app shell automatically

### Component Development Pattern

**Structure Order**:

1. Interface definitions (Props, Emits)
2. Props and emits declarations
3. Composables initialization
4. Reactive state
5. Computed properties
6. Methods
7. Lifecycle hooks

**Event-Driven Architecture**:

- Components emit events, don't call APIs
- Parent components handle business logic
- Use typed emits for type safety
- Props are readonly, never mutate

### State Management Rules

**Store Patterns**:

- Setup stores (not options API)
- Return readonly refs for state
- Implement caching with timestamps
- Handle race conditions with promise memoization
- Use computed for derived state
- Clear state on logout

**Profile/Session Management**:

- Single source: `/profiles/me` endpoint
- 10-minute cache duration
- Automatic company selection
- Retry logic (3 attempts)
- Synchronous permission checks
- localStorage persistence with fallbacks

### Navigation Standards

**Always Use Locale Paths**:

- Programmatic: `router.push(localePath('/path'))`
- Template: `:to="localePath('/path')"`
- With params: `localePath(\`/market/\${id}\`)`
- Never hardcode paths without locale

**Icon Management**:

- Import via `useIcons()` composable only
- Never use string names or direct imports
- Access as destructured constants

### Form Validation Pattern

**Implementation**:

- Use Zod schemas for validation
- Vee-Validate for form management
- Type-safe with TypeScript
- Show inline errors
- Disable submit when invalid
- Handle async validation

### Error Handling Strategy

**API Errors**:

- 401: Clear auth, redirect to login
- 422: Show validation errors
- 500: Show generic error message
- Network: Retry with exponential backoff
- Always provide user feedback

## 5. REST API Integration

### API Configuration

**Base Configuration**:

- Base URL: Environment variable `NUXT_PUBLIC_API_BASE_URL`
- Timeout: 30 seconds
- Retry: 2 attempts for failures
- Auth: Bearer token in Authorization header

### Endpoint Structure

**Naming Conventions**:

```
GET    /api/v1/resources          # List with pagination
GET    /api/v1/resources/{id}     # Get single resource
POST   /api/v1/resources          # Create new
PUT    /api/v1/resources/{id}     # Full update
PATCH  /api/v1/resources/{id}     # Partial update
DELETE /api/v1/resources/{id}     # Delete resource
```

**Special Endpoints**:

```
/api/v1/auth/login              # Authentication
/api/v1/auth/register           # Registration
/api/v1/profiles/me             # Current user profile
/api/v1/auth/verify-email       # Email verification
```

### Request Standards

**Headers**:

- `Content-Type: application/json`
- `Authorization: Bearer {token}`
- `Accept-Language: {locale}`

**Pagination Parameters**:

- `page`: Page number (1-indexed)
- `limit`: Items per page (default: 10)
- `sort`: Sort field
- `order`: asc/desc

**Filter Parameters**:

- Use query strings for filters
- Arrays: `status[]=active&status[]=pending`
- Ranges: `price_min=10&price_max=100`

### Response Formats

**Success Response**:

```
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Paginated Response**:

```
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 10,
    "total": 100
  }
}
```

**Error Response**:

```
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { ... }
  }
}
```

### Recent REST API Changes

The `dev` branch introduces dependency-injection refactors that modify several HTTP behaviours compared to `main`.

**Location headers added to creation endpoints**:

| Endpoint (method) | Additional header |
| --- | --- |
| `/api/v1/devices` (POST) | `Location: /api/v1/devices/{device_id}` |
| `/api/v1/spaces` (POST) | `Location: /api/v1/spaces/{space_id}` |
| `/api/v1/companies` (POST) | `Location: /api/v1/companies/{company_id}` |
| `/api/v1/users` (POST) | `Location: /api/v1/users/{user_id}` |
| `/api/v1/logs/device` (POST) | `Location: /api/v1/logs/{log_id}` |
| `/api/v1/logs/process` (POST) | `Location: /api/v1/logs/{log_id}` |
| `/api/v1/logs/content` (POST) | `Location: /api/v1/logs/{log_id}` |
| `/api/v1/metrics` (POST) | `Location: /api/v1/metrics/{metrics_id}` |
| `/api/v1/products/content` (POST) | `Location: /api/v1/products/content/{content_id}` |
| `/api/v1/products/playlists` (POST) | `Location: /api/v1/products/playlists/{playlist_id}` |
| `/api/v1/products/tools` (POST) | `Location: /api/v1/products/tools/{tool_id}` |
| `/api/v1/market/products/{company_id}` (POST) | `Location: /api/v1/market/products/{product_id}` |
| `/api/v1/market/wanted/{company_id}` (POST) | `Location: /api/v1/market/wanted/{wanted_id}` |

Existing payload bodies stay unchanged unless noted below. Clients that previously ignored headers can continue to do so, but may now derive follow-up navigation without refetching.

**Updated success payloads**:

| Endpoint (method) | Change | New fields |
| --- | --- | --- |
| `/api/v1/market/products/{company_id}` (POST) | Body now includes identifiers | `product_id` |
| `/api/v1/market/wanted/{company_id}` (POST) | Body now includes identifiers | `wanted_id` |
| `/api/v1/logs/process` (POST) | Body now includes identifiers | `log_id` |

**Status code adjustments**:

- `POST /api/v1/auth/register/verify` now returns **201 Created** on success (was 200).
- `POST /api/v1/spaces` returns **403 Forbidden** (was 401) when the caller lacks company access.
- Device/space/company creation & linking endpoints emit **500 Internal Server Error** instead of 404 for persistence failures.
- `POST /api/v1/ai/chat` replies with **503 Service Unavailable** when Redis is unreachable.

**Error payload and model updates**:

- Failure handling now consistently surfaces persistence issues as 500-series responses; rely on status family and `detail` messages rather than prior 404 semantics.
- `User` representations add `onboarding_email_sent: string | null` with ISO8601 timestamps.
- Timestamps emitted by device and metrics models are timezone-aware UTC values by default.

**Operational guards**:

- `POST /api/v1/ai/chat` decrements chat credits only after success; surface an “offline” state on 503.
- `POST /api/v1/products/purchase/{product_id}` validates the `product_type` query argument and returns HTTP 400 “Invalid product type” for unsupported values; missing products still yield 404 sooner.

**Frontend integration checklist**:

1. Accept 201 for email verification success, and handle new 500/503 outcomes.
2. Optionally consume `Location` headers to deep-link newly created resources.
3. Parse newly returned identifiers (`product_id`, `wanted_id`, `log_id`).
4. Treat `onboarding_email_sent` as an optional timestamp.
5. Display a retry/offline state when AI chat returns 503.

### Repository Pattern Implementation

**Structure**:

1. BaseRepository with CRUD operations
2. Domain repositories extend base
3. Repositories handle API calls only
4. Services orchestrate repositories
5. Composables consume services

**Error Handling**:

- Repositories throw typed errors
- Services handle business logic errors
- Composables manage UI state
- Global error handler for uncaught

### Authentication Flow

**Login Process**:

1. POST credentials to `/auth/login`
2. Receive token and user data
3. Store token in auth store
4. Fetch profile from `/profiles/me`
5. Auto-select company if needed
6. Initialize permissions

**Token Management**:

- Store in Pinia + localStorage
- Include in all API requests
- Refresh before expiration
- Clear on 401 response
- Handle expired tokens gracefully

## 6. Data Flow Architecture

### Layer Responsibilities

**Pages** → Route handling, layout selection
**Components** → UI rendering, user interaction
**Composables** → Business logic, state management
**Services** → Operation orchestration
**Repositories** → API communication
**Stores** → Global state, caching

### API Integration Flow

1. User action in component
2. Component emits event
3. Page/parent calls composable
4. Composable calls service
5. Service coordinates repositories
6. Repository makes API call
7. Response flows back up chain
8. UI updates reactively

## 7. Testing Guidelines

### Current State and Metrics

- **Version**: 2.0 (October 2, 2025)
- **Refactor**: Issue #103 migrated the suite from UI-heavy to business-logic tests.
- **Metrics**:
  | Metric | Before | After | Delta |
  | --- | --- | --- | --- |
  | Test files | 57 | 34 (32 unit + 2 e2e) | ↓ 40% |
  | Total tests | 861 | 861 | — |
  | Execution time | ~8.5s | ~4.4s | ↓ 48% |
  | Pass rate | 100% | 100% | — |

### Philosophy

1. Test behavior, not implementation details.
2. Prioritize business logic over presentation.
3. Keep the suite fast, reliable, and resilient to refactors.
4. Avoid duplicating framework or TypeScript guarantees.

### What to Test

**Composables (Business Logic)**
- Data transformations, state transitions, API orchestration, validation, permission, and error handling.

**Repositories (API Layer)**
- Request shaping, headers, response parsing, pagination, rate limiting, and error propagation.

**Stores (Pinia)**
- Mutations, getters, actions, persistence, and side effects.

**Utilities & Type Guards**
- Pure functions, formatters, validators, runtime type checks.

For each area, reference patterns in `tests/unit/**` (e.g., `useAuth.test.ts`, `MarketplaceRepository.test.ts`, `utils/formatters.test.ts`).

### What Not to Test

- DOM structure, Ionic wrappers, CSS classes, or template markup.
- Translation key existence or locale switching behaviour.
- Page components; extract logic into composables instead.
- Vue, Pinia, Nuxt, or Ionic framework internals.

Deleting legacy UI/i18n/page tests that cover only presentation details is encouraged.

### Organization & Naming

```
tests/
├── unit/
│   ├── composables/
│   ├── api/
│   ├── stores/
│   ├── utils/
│   ├── types/
│   └── marketplace/
└── e2e/
```

- Mirror source structure; one test file per source file.
- Use `{name}.test.ts` naming.

### Coverage Requirements

| Scope | Target |
| --- | --- |
| Overall | ≥ 80% |
| Business logic composables | ≥ 90% |
| Repositories & utils | ≥ 95% |
| Stores | ≥ 90% |
| Critical files | 100% |

**Critical files**: `useUserRole`, `BaseRepository`, `useFormValidation`, all repositories, all validation schemas.

Run `npm run test:coverage` for reports; HTML output available at `coverage/index.html`.

### Patterns & Examples

Use Arrange-Act-Assert structure and keep tests independent. Representative templates:

```ts
// Composable pattern
describe('useMyComposable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('handles valid input', () => {
    const { myFunction } = useMyComposable()
    expect(myFunction('valid')).toBe('expected')
  })
})
```

```ts
// Repository pattern
describe('MyRepository', () => {
  const mockApi = vi.fn()
  const repo = new MyRepository()
  repo['api'] = mockApi

  it('formats requests correctly', async () => {
    mockApi.mockResolvedValue({ items: [] })
    await repo.fetchItems()
    expect(mockApi).toHaveBeenCalledWith('/api/items', { method: 'GET' })
  })
})
```

```ts
// Validation pattern
it('rejects invalid payloads', () => {
  const result = schema.safeParse({ email: 'invalid', age: -1 })
  expect(result.success).toBe(false)
})
```

### Best Practices

- Mock external dependencies (API, storage, router).
- Prefer typed emits and public APIs; avoid testing private methods.
- Cover edge cases, error paths, and async flows.
- Keep tests deterministic and fast; avoid real network calls.
- Use descriptive test names and stable selectors (`data-testid`, `aria-label`).

### Running Tests

```bash
npm run test           # All unit tests
npm run test:watch     # Watch mode
npm run test:ui        # Vitest UI runner
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright suite
./safe-test-runner.sh <path> [--coverage]  # Safe wrapper
npx vitest run tests/unit/utils/formatters.test.ts  # Single file
```

Use `./safe-test-runner.sh` for isolated execution (files, directories, or coverage runs).

### Troubleshooting

- **`localStorage` undefined**: Mock via `global.localStorage = { ... }`.
- **`Window.scrollTo` not implemented**: Mock or ignore (jsdom limitation).
- **Pinia store missing**: Call `setActivePinia(createPinia())` in `beforeEach`.

### Lessons Learned & Priorities

- UI-focused tests add little value; focus on composables and repositories.
- Extract logic before testing; keep components thin.
- Prioritize test creation: business logic → repositories → validation → utilities → stores → critical E2E flows.
- Review tests quarterly to prune redundant coverage and maintain speed.

### Seed Test Accounts

Use shared password `password` for:
- `superadmin@mannainsect.com`
- `admin@mannainsect.com`
- `operator@mannainsect.com`
- `free@mannainsect.com`

Leverage existing seed companies to validate role-based behaviours.

## 8. Internationalization (i18n)

### Language Support

- English (en-US) - Default
- Spanish (es-ES)
- French (fr-FR)
- Portuguese (pt-BR)
- German (de-DE)

### Translation Requirements

**ALL text must use translations**:

- UI labels: `$t('common.save')`
- Error messages: `$t('errors.network')`
- Dynamic values: `$t('welcome', { name })`
- Pluralization: `$tc('items', count)`

**Translation Keys Structure**:

```
common.buttons.save
common.messages.loading
auth.login.title
errors.validation.required
marketplace.products.title
```

### Navigation Localization

- Every route must use `localePath()`
- URLs include locale prefix: `/en/market`
- Language switcher in header
- Persist user preference

## 9. Mobile Development

### Capacitor Setup

**Build Process**:

1. `npm run build` - Build web assets
2. `npx cap sync` - Sync to native
3. `npx cap open ios/android` - Open in IDE
4. Deploy via native toolchain

**Platform Detection**:

- Use `Capacitor.getPlatform()`
- Handle platform differences
- Test on real devices
- Implement native features carefully

### Mobile Considerations

- Touch-friendly UI (44px minimum)
- Offline capability
- Push notifications
- Native storage
- Camera/gallery access
- App store guidelines

## 10. Performance Guidelines

### Optimization Strategies

**Component Level**:

- Lazy load heavy components
- Use `v-memo` for expensive lists
- Implement virtual scrolling
- Optimize images with Nuxt Image

**State Management**:

- Cache API responses
- Implement stale-while-revalidate
- Use computed properties
- Avoid store destructuring

**Network**:

- Batch API requests
- Implement request debouncing
- Use compression
- Cache static assets

### Build Optimization

**Nuxt Configuration**:

- Enable SSR/SSG appropriately
- Configure route rules
- Optimize bundle splitting
- Enable modern build

## 11. Security Standards

### Authentication Security

- HTTPS only in production
- Secure token storage
- XSS protection
- CSRF tokens
- Rate limiting
- Input sanitization

### API Security

- Validate all inputs
- Sanitize user content
- Use parameterized queries
- Implement proper CORS
- Audit logging
- Error message sanitization

## 12. Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Lint errors resolved
- [ ] Type checks passing
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Performance benchmarks met

### Production Configuration

- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] CDN setup
- [ ] SSL certificates
- [ ] Backup strategy
- [ ] Monitoring alerts

### Environment Variables

```
NUXT_PUBLIC_API_BASE_URL  # API endpoint
NUXT_PUBLIC_APP_ENV       # Environment (dev/staging/prod)
```

### Key Composables

- `useAuth()` - Authentication
- `useApi()` - API client
- `useIcons()` - Icon management
- `useProfile()` - User profile
- `useSafeLocalePath()` - i18n navigation
- `useFormValidation()` - Form handling
- `useErrorHandler()` - Error management

### Store Methods

- `authStore.login()` - User login
- `authStore.logout()` - User logout
- `authStore.fetchProfile()` - Get profile
- `authStore.ensureProfileData()` - Bootstrap
- `authStore.refreshProfile()` - Force refresh

---

For detailed API documentation, refer to backend OpenAPI specs at
`/api/docs`.

For component examples, review existing implementations in the codebase
rather than creating new patterns.
