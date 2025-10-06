/**
 * Content & Products API Types
 * Based on /docs/CONTENT_GUIDANCE.md
 */

// Allowed values for tags
export type ProfileTag =
  | 'newbie'
  | 'business'
  | 'insect_farmer'
  | 'ngo'
  | 'startup'
  | 'animal_grower'
  | 'other'

export type CategoryTag =
  | 'pre_processing'
  | 'post_processing'
  | 'breeding'
  | 'rearing'
  | 'nursing'
  | 'sales'
  | 'substrate'
  | 'business'
  | 'financing'
  | 'metrics'
  | 'tech'
  | 'frass'
  | 'sustainability'
  | 'animal_growing'
  | 'insect_farm_hub'
  | 'manna_mind'
  | 'technical_guidance'
  | 'other'

export type ContentCategory =
  | 'video'
  | 'document'
  | 'course'
  | 'podcast'
  | 'webinar'
  | 'tech_support'

export type ContentLevel = 'basic' | 'intermediate' | 'advanced'

export type PlaylistCategory =
  | 'course'
  | 'support_mind'
  | 'tech_support'

export type ToolCategory =
  | 'learn'
  | 'farming'
  | 'business'
  | 'analytics'

/**
 * Public content response (for anonymous users)
 * Premium content has url masked to null
 */
export interface ContentPublic {
  _id: string
  title: string
  description: string
  category: ContentCategory
  level: ContentLevel
  credits: number
  profile_tags: ProfileTag[]
  category_tags: CategoryTag[]
  url: string | null
  active: boolean
  expiry_days: number
  created_at: string
  available_at: string
}

/**
 * Authenticated content response
 * Includes ownership and watch status
 */
export interface Content extends ContentPublic {
  url: string
  owned: boolean
  watched: boolean
}

/**
 * Tool resource
 */
export interface Tool {
  _id: string
  name: string
  description: string
  api_name: string
  category: ToolCategory
  credits: number
  profile_tags: ProfileTag[]
  category_tags: CategoryTag[]
  active: boolean
  expiry_days: number
  owned?: boolean
}

/**
 * Playlist includes structure
 */
export interface PlaylistIncludes {
  content: string[]
  tools: string[]
}

/**
 * Playlist resource
 */
export interface Playlist {
  _id: string
  name: string
  description: string
  category: PlaylistCategory
  level: ContentLevel
  credits: number
  profile_tags: ProfileTag[]
  category_tags: CategoryTag[]
  includes: PlaylistIncludes
  active: boolean
  available_at: string
  owned: boolean
  watched: boolean
}

/**
 * Populated playlist with full objects
 */
export interface PopulatedPlaylist
  extends Omit<Playlist, 'includes'> {
  includes: {
    content: Content[]
    tools: Tool[]
  }
}

/**
 * Purchased product entry
 */
export interface PurchasedProduct {
  product: string
  product_type: string
  product_name: string
  expires_at: string | null
}

/**
 * Content creation request
 */
export interface ContentCreate {
  title: string
  description: string
  category: ContentCategory
  level: ContentLevel
  credits: number
  url: string
  profile_tags: ProfileTag[]
  category_tags: CategoryTag[]
  available_at?: string
  active?: boolean
  expiry_days?: number
}

/**
 * Content update request (all fields optional)
 */
export interface ContentUpdate {
  title?: string
  description?: string
  category?: ContentCategory
  level?: ContentLevel
  credits?: number
  url?: string
  profile_tags?: ProfileTag[]
  category_tags?: CategoryTag[]
  available_at?: string
  active?: boolean
  expiry_days?: number
}

/**
 * Playlist creation request
 */
export interface PlaylistCreate {
  name: string
  description: string
  category: PlaylistCategory
  level: ContentLevel
  credits: number
  profile_tags: ProfileTag[]
  category_tags: CategoryTag[]
  includes?: PlaylistIncludes
  available_at?: string
  active?: boolean
}

/**
 * Playlist update request (all fields optional)
 */
export interface PlaylistUpdate {
  name?: string
  description?: string
  category?: PlaylistCategory
  level?: ContentLevel
  credits?: number
  profile_tags?: ProfileTag[]
  category_tags?: CategoryTag[]
  includes?: PlaylistIncludes
  available_at?: string
  active?: boolean
}

/**
 * Tool creation request
 */
export interface ToolCreate {
  name: string
  description: string
  api_name: string
  category: ToolCategory
  credits: number
  profile_tags: ProfileTag[]
  category_tags: CategoryTag[]
  active?: boolean
  expiry_days?: number
}

/**
 * Tool update request (all fields optional)
 */
export interface ToolUpdate {
  name?: string
  description?: string
  api_name?: string
  category?: ToolCategory
  credits?: number
  profile_tags?: ProfileTag[]
  category_tags?: CategoryTag[]
  active?: boolean
  expiry_days?: number
}

/**
 * Product type for purchase endpoint
 */
export type ProductType =
  | 'content'
  | 'tool'
  | 'playlist'
  | 'video'
  | 'document'
  | 'podcast'
  | 'webinar'
