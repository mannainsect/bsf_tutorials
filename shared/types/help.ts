/**
 * Help system type definitions
 */

/**
 * Enum for available help topics throughout the application
 */
export enum HelpTopic {
  MARKET_FILTERING = 'market.filtering',
  PRODUCT_CONTACT = 'product.contact',
  WANTED_POSTING = 'wanted.posting',
  PROFILE_SETTINGS = 'profile.settings'
}

/**
 * Structure for individual help sections
 */
export interface HelpSection {
  title: string
  content: string
}

/**
 * Main help content structure
 */
export interface HelpContent {
  title: string
  content: string
  sections?: HelpSection[]
}

/**
 * Type guard to validate if a string is a valid HelpTopic
 */
export const isValidHelpTopic = (
  topic: string
): topic is HelpTopic => {
  return Object.values(HelpTopic).includes(topic as HelpTopic)
}

/**
 * Type for help topic keys used in translations
 */
export type HelpTopicKey = keyof typeof HelpTopic

/**
 * Type for parsed topic path (e.g., ['market', 'filtering'])
 */
export type HelpTopicPath = string[]