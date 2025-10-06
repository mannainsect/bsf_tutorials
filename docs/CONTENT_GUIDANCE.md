# Content & Products API Guidance

This guide explains how to consume the learning content, playlists, and tools
endpoints that power the Manna Cloud front-end experiences. All paths below are
served under the API v1 prefix.

## Base URL, Versioning, and Formats

- Base path: `/api/v1`; combine with the environment host (e.g.
  `https://api.mannacloud.io/api/v1/products/content`).
- Responses follow FastAPI defaults: JSON bodies, HTTP status codes, and
  `{"detail": "..."}` error payloads for exceptions.
- Timestamps are returned in ISO 8601 with a trailing `Z` (UTC). Any request
  payload containing datetimes must also be timezone aware, otherwise the API
  responds with `400 Timezone required`.
- Numeric credit values represent whole credits. Negative credits never appear
  in responses (premium masking adjusts values to be `>= 0`).

## Authentication and Authorization

- Send an `Authorization: Bearer <access_token>` header obtained via
  `POST /api/v1/auth/login/token`.
- Every endpoint in this module except
  `GET /api/v1/products/content/public` requires an authenticated user.
- Write operations (`POST`, `PUT`, `DELETE`) additionally require the
  authenticated user to be a **superadmin**. Non-superadmin users receive
  `403 Not authorized`.
- Purchasing a product (`POST /products/purchase/{product_id}`) is available to
  any authenticated user with sufficient credits. Duplicate purchases are
  rejected with `400 Product already purchased`.

## Domain Objects

### Content

Returned by authenticated content endpoints.

**Key Fields**:

- `title`, `description`: Content metadata
- `category`: One of `video`, `document`, `course`, `podcast`, `webinar`,
  `tech_support`
- `level`: `basic`, `intermediate`, or `advanced`
- `credits`: Purchase cost
- `url`: Video/content URL
- `profile_tags`, `category_tags`: Filtering tags
- `created_at`, `available_at`: Timestamps (ISO 8601)
- `active`: Visibility flag
- `expiry_days`: Access duration after purchase
- `owned`: Computed per user (already purchased)
- `watched`: Computed per user (has watch log)

### Content (public)

Same as Content but `url` may be `null` for premium items (non-basic or
`credits > 0`).

### Playlist

**Key Fields**:

- `name`, `description`: Playlist metadata
- `category`: `course`, `support_mind`, or `tech_support`
- `level`: `basic`, `intermediate`, or `advanced`
- `credits`: Purchase cost
- `profile_tags`, `category_tags`: Filtering tags
- `includes`: Stores IDs (`{"content": [...], "tools": [...]}`)
- `active`: Visibility flag
- `available_at`: Launch timestamp
- `owned`: Computed per user (already purchased)
- `watched`: Computed per user (has watch log)

### Populated Playlist

Same as Playlist but `includes` contains full content/tool objects.
Returned by `GET /products/playlists/{playlist_id}`. Each embedded
content item also exposes `owned`/`watched`.

### Tool

**Key Fields**:

- `name`, `description`: Tool metadata
- `api_name`: Internal API identifier
- `category`: `learn`, `farming`, `business`, or `analytics`
- `credits`: Purchase cost
- `profile_tags`, `category_tags`: Filtering tags
- `active`: Visibility flag
- `expiry_days`: Access duration after purchase

### PurchasedProduct

Appended to the user document after successful purchase. Drives `owned`
flags in subsequent reads.

**Key Fields**:

- `product`: Product ID
- `product_type`: Type of product
- `product_name`: Display name
- `expires_at`: Expiration timestamp (null for permanent access)

Allowed tag values are shared across resources:

- `profile_tags`: `newbie`, `business`, `insect_farmer`, `ngo`, `startup`,
  `animal_grower`, `other`
- `category_tags`: `pre_processing`, `post_processing`, `breeding`, `rearing`,
  `nursing`, `sales`, `substrate`, `business`, `financing`, `metrics`, `tech`,
  `frass`, `sustainability`, `animal_growing`, `insect_farm_hub`,
  `manna_mind`, `technical_guidance`, `other`

### Video URL Format

The backend provides **ready-to-use Vimeo Player URLs** that can be
used directly in iframe `src` attributes without any transformation:

**Format**: `https://player.vimeo.com/video/{VIDEO_ID}?{PARAMETERS}`

**Example**:

```
https://player.vimeo.com/video/1100272661?badge=0&autopause=0&
player_id=0&app_id=58479
```

**Key Points**:

- URLs are already in `player.vimeo.com` format (not `vimeo.com`)
- URLs include pre-configured parameters
- Can be used directly in iframe `src` attribute
- No video ID extraction needed

**URL Parameters**:

| Parameter      | Value    | Purpose                                     |
| -------------- | -------- | ------------------------------------------- |
| `badge=0`      | disabled | Hides Vimeo badge overlay                   |
| `autopause=0`  | disabled | Prevents auto-pause when player not visible |
| `player_id=0`  | 0        | Default player instance ID                  |
| `app_id=58479` | 58479    | Vimeo application ID                        |

**Implementation Note**: Use simple iframe embedding with the `url`
field directly. No need for @vimeo/player library or video ID
extraction for basic video display.

## Endpoint Reference

### Public catalogue

#### GET `/api/v1/products/content/public`

Returns video content for anonymous landing pages.

Query parameters:

- `category_tags`: repeatable, filters items containing any of the supplied
  tags (logical OR).
- `profile_tags`: repeatable, filters items by target profile tags.

Response: `200 OK` with `ContentPublic[]`.

- URLs for premium content (`level != "basic"` or `credits > 0`) are masked
  to `null`.
- `credits` are clamped to non-negative values.

### Authenticated content catalogue

#### GET `/api/v1/products/content`

Returns all content items visible to the current user. Defaults to
`filter=video`.

Query parameters:

- `filter`: `video` (default), `document`, `course`, etc. Use `all` to disable
  filtering.

Response: `200 OK` with `Content[]`. Each object includes:

- `owned`: `true` if the user already purchased the item (based on
  `user.purchased_products`).
- `watched`: `true` if the user has a `content_watched` log for the item.

#### GET `/api/v1/products/content/{content_id}`

Fetch a single content item, with `owned`/`watched` metadata populated.

Responses:

- `200 OK` with `Content`
- `404 Not Found` if the ID does not exist

#### POST `/api/v1/products/content`

Create a new content item (**superadmin only**).

Request body: `ContentCreate`. Required fields include `title`, `description`,
`category`, `level`, `credits`, `url`, `profile_tags`, and `category_tags`.

- `category` must be in the allowed list above.
- `level` must be `basic`, `intermediate`, or `advanced`.
- `url` must be non-empty.

Responses:

- `201 Created` with body `{"status": "Content created successfully"}` and a
  `Location` header pointing to the new resource.
- `403 Not authorized` if the user lacks superadmin rights.
- `500 Failed to insert content into database` on persistence errors.

#### PUT `/api/v1/products/content/{content_id}`

Update an existing content item (**superadmin only**).

Request body: `ContentUpdate` (all fields optional; send only fields to change).
Set `available_at` with an ISO 8601 datetime that includes timezone info.

Responses:

- `200 OK` with body `{"status": "Content updated successfully"}`
- `403 Not authorized`
- `404 Content not found`
- `400 Failed to update content` if validation passes but persistence fails

#### DELETE `/api/v1/products/content/{content_id}`

Soft-deactivates content by toggling `active = False` (**superadmin only**).

Responses:

- `200 OK` with body `{"status": "Content disabled successfully"}`
- `403 Not authorized`
- `404 Content not found`
- `400 Failed to delete content` if the write operation fails

### Playlists

#### GET `/api/v1/products/playlists`

List playlists available to the current user.

Query parameters:

- `filter`: defaults to `course`. Use `support_mind`, `tech_support`, or `all`.

Response: `200 OK` with `Playlist[]` where `owned` is set for purchased items.

#### GET `/api/v1/products/playlists/{playlist_id}`

Retrieve one playlist with embedded content and tools.

Responses:

- `200 OK` with `PopulatedPlaylist`
- `404 Playlist not found`

The backend populates `includes.content` and `includes.tools` arrays with full
objects. Every embedded content item has `owned`/`watched` flags resolved using
the current user's purchase history and logs.

#### POST `/api/v1/products/playlists`

Create a playlist (**superadmin only**).

Request body: `PlaylistCreate`. `includes` defaults to empty arrays but must be
well-formed when provided. Category and level validations follow the allowed
lists above.

Responses mirror the content creation endpoint (`201`, `403`, `500`).

#### PUT `/api/v1/products/playlists/{playlist_id}`

Update a playlist (**superadmin only**).

Request body: `PlaylistUpdate` (partial updates). Use timezone-aware datetimes
for `available_at`.

Responses mirror the content update endpoint (`200`, `403`, `404`, `400`).

#### DELETE `/api/v1/products/playlists/{playlist_id}`

Soft-deactivate a playlist (**superadmin only**). Returns the same status codes
as the content delete endpoint.

### Tools

#### GET `/api/v1/products/tools`

List all tools the user can access. Response is `200 OK` with `Tool[]`. The API
marks owned tools using the same purchase logic as content.

#### GET `/api/v1/products/tools/{tool_id}`

Fetch a single tool. Responses:

- `200 OK` with `Tool`
- `404 Tool not found`

#### POST `/api/v1/products/tools`

Create a tool (**superadmin only**). Request body: `ToolCreate`. Category,
profile tag, and category tag validations mirror those defined earlier.

Responses follow the same pattern as other create endpoints (`201`,
`403`, `500`).

#### PUT `/api/v1/products/tools/{tool_id}`

Update a tool (**superadmin only**). Request body: `ToolUpdate`
(partial update).
Responses: `200`, `403`, `404`, `400 Failed to update tool`.

#### DELETE `/api/v1/products/tools/{tool_id}`

Soft-deactivate a tool (**superadmin only**). Responses: `200`, `403`, `404`,
`400 Failed to delete tool`.

### Purchasing content, playlists, or tools

#### POST `/api/v1/products/purchase/{product_id}`

Purchases the specified product for the authenticated user by debiting credits
and appending an entry to `purchased_products`.

Query parameters:

- `product_type` (required): one of `content`, `tool`, `playlist`, `video`,
  `document`, `podcast`, `webinar`. `video`, `document`, `podcast`, and
  `webinar` resolve to the content collection.

Responses:

- `200 OK` with `{"status": "Product purchased successfully"}`
- `400 Invalid product type`
- `400 Product already purchased`
- `400 Failed to update balance` if the credit handler cannot debit credits
- `404 Product not found`
- `500 Product name not found` if the referenced item lacks a title/name

> Tip: After a successful purchase, subsequent calls to the relevant
> GET endpoints will return `owned: true` for the user, enabling immediate UI
> updates without another round-trip.

## Request & Response Examples

### Fetch public videos by tag

```http
GET /api/v1/products/content/public?category_tags=breeding HTTP/1.1
Host: api.mannacloud.io
Accept: application/json
```

```json
[
  {
    "_id": "653f0b35f42a7f6a4d5e02c9",
    "title": "Breeding Room Walkthrough",
    "description": "Orientation for first-time breeders",
    "category": "video",
    "level": "basic",
    "credits": 0,
    "profile_tags": ["newbie", "insect_farmer"],
    "category_tags": ["breeding"],
    "url": "https://player.vimeo.com/video/1100272661?badge=0&autopause=0&player_id=0&app_id=58479",
    "active": true,
    "expiry_days": -1,
    "created_at": "2025-01-05T09:00:00Z",
    "available_at": "2025-01-05T09:00:00Z"
  }
]
```

### Purchase a playlist

```http
POST /api/v1/products/purchase/6540c8a9ad2f5bf7c0d1e7ab?\
product_type=playlist HTTP/1.1
Host: api.mannacloud.io
Authorization: Bearer <token>
Content-Length: 0
```

```json
{ "status": "Product purchased successfully" }
```

### Update premium content metadata (superadmin)

```http
PUT /api/v1/products/content/653f0b35f42a7f6a4d5e02c9 HTTP/1.1
Host: api.mannacloud.io
Authorization: Bearer <token>
Content-Type: application/json

{
  "credits": 1500,
  "available_at": "2025-10-06T12:00:00Z",
  "profile_tags": ["business"],
  "category_tags": ["breeding", "business"]
}
```

```json
{ "status": "Content updated successfully" }
```

---

Use this document as the canonical reference when building front-end flows for
catalogues, detail pages, and purchasing workflows. Keep an eye on the
`Location` headers and the `owned`/`watched` metadata to deliver responsive UI
updates after writes.
