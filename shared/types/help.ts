/**
 * Help system type definitions
 */

/**
 * Enum for available help topics throughout the application
 */
export enum HelpTopic {
  GETTING_STARTED = 'gettingStarted.overview',
  PROFILE_SETTINGS = 'profile.settings',
  ACCOUNT_SECURITY = 'account.security'
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