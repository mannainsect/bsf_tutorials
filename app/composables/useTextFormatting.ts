import { marked } from 'marked'
import DOMPurify from 'dompurify'

// TypeScript interface for extracted links
export interface ExtractedLink {
  url: string
  text: string
}

export const useTextFormatting = () => {
  // Configure marked with safe defaults
  marked.setOptions({
    breaks: true,        // Convert line breaks to <br>
    gfm: true,          // Enable GitHub Flavored Markdown
    headerIds: false,   // Disable header IDs for security
    mangle: false       // Don't mangle email addresses
  })

  /**
   * Format markdown text to safe HTML
   * @param text - The markdown text to format
   * @returns Sanitized HTML string
   */
  const formatMarkdown = (text: string): string => {
    if (!text) return ''

    try {
      // Limit input length for performance
      const truncatedText = text.slice(0, 10000)

      // Parse markdown to HTML
      const rawHtml = marked.parse(truncatedText)

      // Sanitize HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's',
          'ul', 'ol', 'li', 'blockquote', 'code',
          'pre', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false
      })

      return cleanHtml
    } catch (error) {
      console.warn('Error formatting markdown:', error)
      // Fallback to plain text
      return DOMPurify.sanitize(text)
    }
  }

  /**
   * Extract URLs from markdown text
   * @param text - The markdown text to extract URLs from
   * @returns Array of extracted links with URL and text
   */
  const extractUrls = (text: string): ExtractedLink[] => {
    if (!text) return []

    const links: ExtractedLink[] = []
    const seenUrls = new Set<string>()

    try {
      // Extract markdown links [text](url)
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      let match

      while ((match = markdownLinkRegex.exec(text)) !== null) {
        const [, linkText, url] = match
        if (url && (url.startsWith('http://') ||
                   url.startsWith('https://'))) {
          if (!seenUrls.has(url)) {
            seenUrls.add(url)
            links.push({
              url: url.trim(),
              text: linkText.trim() || url.trim()
            })
          }
        }
      }

      // Extract plain URLs from text
      const plainUrlRegex =
        /(?:^|[\s])(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g

      while ((match = plainUrlRegex.exec(text)) !== null) {
        const url = match[1]
        if (!seenUrls.has(url)) {
          seenUrls.add(url)
          // For plain URLs, use domain as text
          let displayText = url
          try {
            const urlObj = new URL(url)
            displayText = urlObj.hostname
          } catch {
            // Keep full URL if parsing fails
          }
          links.push({
            url: url.trim(),
            text: displayText
          })
        }
      }
    } catch (error) {
      console.warn('Error extracting URLs:', error)
    }

    return links
  }

  return {
    formatMarkdown,
    extractUrls
  }
}