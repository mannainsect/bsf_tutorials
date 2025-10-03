# BSF Marketplace

A modern web application for user registration and account management.

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bsf_market/main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your API endpoint:
   ```
   NUXT_PUBLIC_API_BASE_URL=https://your-api-url.com
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

## Features

### BSF Marketplace

#### Product Listings
- Browse and search BSF products without authentication
- View detailed product information with images and specifications
- Rich text descriptions with markdown formatting support
- Automatic extraction and display of links from descriptions
- Navigate directly to product detail pages without login requirements
- Dual-mode access: Public browsing with rate limiting (100 req/hr)
- Authentication required only for seller contact actions
- Advanced unified search and filter system:
  - Text search with optional regex pattern support
  - Category and subcategory cascading filters
  - Multi-select country filtering (OR logic)
  - Bidirectional sorting (price numeric, title alphabetical)
  - Visual filter chips showing active filters
  - Debounced search for optimal performance (300ms delay)
- Random featured product showcase on homepage
- Full internationalization support (EN, ES, FR, PT, DE)
- Edit and delete your own listings (admin/manager role required)
- Edit mode support with pre-filled forms for updating listings
- Centralized "My Listings" page to manage all your products
- **Add Listing button**: Prominently placed button for quick product
  creation. Shows auth modal for unauthenticated users

#### Wanted Listings
- Browse wanted items (buy requests) from BSF companies
- View complete wanted item details without authentication
- Post and manage wanted listings for products you need
- Budget range specification (min/max) instead of fixed pricing
- Expiry date tracking for time-sensitive requests
- Advanced unified search and filter system:
  - Text search with optional regex pattern support
  - Category and subcategory cascading filters
  - Multi-select country filtering (OR logic)
  - Bidirectional sorting by title
  - Visual filter chips showing active filters
  - Debounced search for optimal performance (300ms delay)
- Authentication required only for buyer contact actions
- Complete isolation from product marketplace
- Edit and delete your own wanted listings (admin/manager role required)
- Edit mode support with pre-filled forms for updating listings
- Centralized "My Listings" page to manage all your wanted items
- **Add Listing button**: Quick access to create wanted listings.
  Authentication prompt for non-logged in users

### User Registration
- Create a new account with email and password
- Email verification required for account activation
  - Automatic verification: Click link in email to auto-verify account
  - Manual verification: Enter token from email on verification page
- Secure password requirements enforced

### User Login
- Login with email and password
- Passwordless login option via email token
- Persistent session management
- Automatic company selection: When no active company is set, the system
  automatically selects the first available company from your company list

### Account Settings
- View and edit profile information
- Update personal details
- Change password
- Manage account preferences
- **Company Management**: View and edit company information
  (admin/manager role required)
  - Update company name, address, and location details
  - Configure timezone and business ID
  - Access company settings directly from listing creation forms

### Help System
- Context-sensitive help icons throughout the application
- Comprehensive help modal with topic-based organization
- Available topics: marketplace filtering, product contact, wanted
  postings, and profile settings
- Full internationalization support (EN, ES, FR, PT, DE)
- Accessible from key pages: market, product detail, wanted, settings

### Profile & Session Management
- **Single Source of Truth**: All profile data fetched from `/profiles/me`
  endpoint, eliminating race conditions and duplicate API calls
- **10-minute Cache**: Profile data cached for performance, with automatic
  refresh when stale
- **Profile Bootstrap**: Authentication middleware ensures profile is fully
  loaded before private routes render
- **Automatic Company Selection**: System auto-selects first available
  company when no active company is set
- **Synchronous Permissions**: All permission checks read from cached state,
  no async API calls during permission validation

## Usage

### Layout System

The application uses automatic layout selection based on authentication
state through a global middleware system:

#### Automatic Layout Selection

- **Public Layout**: Automatically applied to all pages when user is not
  authenticated
- **Private Layout**: Automatically applied to all pages when user is
  authenticated
- **No Manual Configuration Required**: Pages do not need to specify a
  layout in `definePageMeta()`

#### Special Cases

Only the login and register pages explicitly set the public layout:

```vue
<!-- Only for login/register pages -->
<script setup>
definePageMeta({
  layout: 'public',
  middleware: 'guest'
})
</script>
```

All other pages should not specify a layout - it will be selected
automatically based on the user's authentication state.

### Marketplace Access

#### Products Marketplace

1. **Public Browsing**: Navigate to `/market` to browse BSF products
   without an account. Click on any product to view full details.
   Rate limited to 100 requests per hour.

2. **Product Details**: View complete product information including
   images, specifications, and pricing without authentication.

3. **Seller Contact**: Authentication required only when attempting
   to contact sellers via the "Contact Seller" button.

4. **Product Discovery**: Use the unified search and filter system to
   find specific products efficiently.

5. **Add New Products**: Click the "Add Listing" button below the search
   filters to create a new product. Authenticated users are taken
   directly to the product creation form with bulk country selection
   options (Select All Countries / Clear All). Non-authenticated users
   see an auth modal prompting them to sign in or register first. Forms
   include helpful guidance about country selection and links to update
   company information.

#### Wanted Marketplace

1. **Browse Wanted Items**: Navigate to `/wanted` to view buy requests
   from BSF companies. Click on any item for full details.
   Public access with rate limiting.

2. **Wanted Details**: View complete wanted item information including
   budget range, quantity, and requirements without authentication.

3. **Buyer Contact**: Authentication required only when attempting
   to contact buyers via the "Contact Buyer" button.

4. **Post Wanted Listings**: Click the "Add Listing" button below the
   search filters to create a new wanted listing. Authenticated users
   can create listings specifying budget range, quantity, and
   requirements with bulk country selection (Select All / Clear All).
   Non-authenticated users are prompted to sign in. Forms include
   contextual help and direct links to company settings.

### Advanced Search and Filtering

The marketplace features a powerful unified search and filter system
available on both product and wanted listings pages:

#### Text Search
- **Standard Search**: Type keywords to search through titles,
  descriptions, and company names
- **Regex Mode**: Click the regex icon to enable pattern-based searches
  - Example: `BSF.*larvae` finds "BSF dried larvae", "BSF live larvae"
  - Safety: Built-in ReDoS protection prevents malicious patterns
  - Performance: Regex patterns execute in under 50ms for 100+ items

#### Filter Options
- **Category Filter**: Select a main category to narrow results
- **Subcategory Filter**: Automatically populated based on selected
  category for drill-down filtering
- **Country Filter**: Multi-select countries using OR logic (shows items
  from any selected country)
- **Sort Options**:
  - Products: Sort by price (ascending/descending) or title (A-Z/Z-A)
  - Wanted: Sort by title (alphabetical both directions)

#### Filter Management
- **Visual Chips**: Active filters display as removable chips
- **Country Display**: Shows country names with flag emojis for better UX
- **Clear Individual**: Click the X on any chip to remove that filter
- **Clear All**: Remove all active filters with one click
- **Persistent State**: Filters remain active while browsing details

### Managing Your Listings

#### My Listings Page

1. **Centralized Management**: Navigate to "My Listings" from the main menu
   to view all your products and wanted items in one place.

2. **Quick Overview**: See all your active marketplace listings with key
   details like title, price/budget, and status.

3. **Easy Actions**: Each listing has edit and delete buttons for quick
   management without navigating to detail pages.

#### Creating and Editing Listings

1. **Country Selection Features**: When creating or editing listings, use
   bulk country selection options:
   - **Select All Countries**: One-click selection of all 250 countries
   - **Clear All**: Remove all country selections instantly
   - Supports up to 250 countries per listing (increased from 50)

2. **Access Edit Mode**: Click the edit icon on your listing from either
   the My Listings page or the detail page. Only visible if you're the
   owner with admin/manager role in the company.

3. **Update Information**: Forms are pre-filled with current data. Change
   only what needs updating - all fields are optional in edit mode.

4. **Save Changes**: Submit updates which are immediately reflected in the
   marketplace.

#### Deleting Listings

1. **Delete Button**: Click the trash icon on your listing from either
   the My Listings page or the detail page.

2. **Confirmation**: A confirmation dialog appears to prevent accidental
   removals. Confirm to proceed with deletion.

3. **Permanent Removal**: Once confirmed, the listing and all associated
   data is permanently deleted.

#### Permission Requirements

- You must be logged in with the same company that created the listing
- You must have admin or manager role in that company
- The system automatically verifies permissions before showing edit/delete
  options

### User Account

1. **First Time Users**: Navigate to the registration page and create
   an account. Check your email for the verification link.
   - **Email Verification**: Click the verification link in your email
     to automatically verify your account. The link format is
     `/auth/verify-email?token={token}` and will auto-submit the token.
   - **Manual Entry**: If the automatic verification fails, you'll be
     redirected to enter the token manually on `/verify-token`.

2. **Returning Users**: Use your email and password to login, or request
   a login token via email. Upon login, if you don't have an active
   company selected, the system automatically selects your first available
   company. This ensures seamless access to company-specific features.

3. **Account Management**: Once logged in, access your account settings
   from the main menu to update your profile and preferences. The
   account page displays your first 3 products with a "Show more"
   indicator if you have additional listings.

4. **Company Management**: Users with admin or manager roles can edit
   their company information directly from the account page. Listing
   creation forms include helpful links to update company details.

5. **Company Selection**: The application automatically manages your
   active company. If the profile API doesn't return an active company,
   the first company from your available companies list is selected
   automatically with retry logic for reliability.

## Architecture

### Profile/Session Architecture

The application implements a robust profile and session management system
designed to eliminate race conditions and ensure consistent state:

#### Core Principles

1. **Single API Endpoint**: `/profiles/me` serves as the sole source for all
   user session data, including user info, company data, and permissions.

2. **Centralized State**: All components read from Pinia store state only.
   No direct API calls from components or pages.

3. **Profile Bootstrap**: The auth middleware (`app/middleware/auth.ts`)
   ensures profile data is fully loaded before rendering private routes.

4. **Synchronous Permission System**: Permission checks
   (`app/composables/useUserRole.ts`) are synchronous, reading from
   localStorage cached by the auth store.

#### Key Components

- **Auth Store** (`app/stores/auth.ts`):
  - Manages profile fetching with concurrency control
  - Normalizes MongoDB id/_id inconsistencies
  - Implements 10-minute cache with automatic refresh
  - Provides `refreshProfile()` and `ensureProfileData()` methods

- **Auth Middleware** (`app/middleware/auth.ts`):
  - Made async to bootstrap profile before route rendering
  - Handles network errors with appropriate redirects
  - Ensures profile data is available before page load

- **User Role Composable** (`app/composables/useUserRole.ts`):
  - All methods converted to synchronous
  - Reads from cached localStorage for performance
  - No API calls during permission checks

#### Error Handling

- **localStorage Quota**: Gracefully handles quota exceeded errors
- **Disabled localStorage**: Falls back to safe defaults
- **Network Errors**: Implements retry logic with exponential backoff
- **Authentication Errors**: Redirects to login with state cleanup

## Key Dependencies

### Text Processing
- **marked**: Markdown parser for rendering rich text descriptions
- **dompurify**: XSS protection for sanitizing HTML content
- Secure markdown rendering with limited allowed tags
- Automatic URL extraction from markdown content

## Testing

### Running Tests

**IMPORTANT**: Use the safe test runner script to avoid terminal crashes:

```bash
# Run unit tests safely
./safe-test-runner.sh unit

# Run E2E tests (requires manual server startup)
./safe-test-runner.sh e2e

# Run all tests
./safe-test-runner.sh all
```

### Test Infrastructure

- **Unit Testing**: Vitest with jsdom environment
- **E2E Testing**: Playwright for cross-browser testing
- **Test Coverage**: Configured with v8 provider
- **Safe Runner**: Shell script prevents terminal crashes

### Test Commands

```bash
# Direct commands (use with caution)
npx vitest run --no-coverage    # Run unit tests without coverage
npx playwright test              # Run E2E tests (server must be running)
```


Note: Playwright runs Chromium only by default for speed. To run the full cross-browser/device matrix, set `PW_ALL=1`:

```bash
PW_ALL=1 npx playwright test
```

### Test Structure

The test suite focuses on business logic and functional correctness,
not UI implementation details. See `/docs/testing-guidelines.md` for
comprehensive testing philosophy and patterns.

**Current Status**: 34 test files (32 unit + 2 e2e), 861 tests, 100%
pass rate

```
tests/
├── setup/          # Test configuration and setup
│   ├── test-setup.ts       # Vitest setup with Nuxt mocks
│   ├── ionic-stubs.ts      # Ionic component stubs
│   └── global.d.ts         # TypeScript declarations
├── unit/           # Unit tests (business logic focused)
│   ├── composables/        # Business logic composables
│   │   ├── useTextFormatting.test.ts
│   │   ├── useSearchFilter.test.ts
│   │   ├── useListingCreation.test.ts
│   │   ├── useMyListings.test.ts
│   │   └── validation/     # Validation composables
│   │       └── useFormValidation.test.ts
│   ├── stores/             # Pinia store tests
│   │   └── auth.test.ts
│   ├── utils/              # Utility function tests
│   │   ├── formatters.test.ts
│   │   ├── countries.test.ts
│   │   └── validation/
│   │       └── listingSchemas.test.ts
│   ├── api/                # API repository tests
│   │   └── LogRepository.test.ts
│   ├── messaging/          # Messaging feature tests
│   │   ├── useMessaging.test.ts
│   │   └── MessageComposer.test.ts
│   └── marketplace/        # Marketplace feature tests
│       ├── MarketplaceRepository.test.ts
│       ├── WantedRepository.test.ts
│       └── wanted/
│           └── type-guards.test.ts
├── e2e/            # End-to-end tests
│   ├── homepage.spec.ts
│   └── marketplace.spec.ts
└── mocks/          # Mock implementations
    └── api.ts
```

**Key Testing Principles**:
- Test business logic, not UI rendering
- Test composables and repositories, not components
- Focus on behavior and data transformation
- Use E2E tests for critical user flows

## Support

For issues or questions, please contact the support team or open an
issue in the repository.

## License

All rights reserved.