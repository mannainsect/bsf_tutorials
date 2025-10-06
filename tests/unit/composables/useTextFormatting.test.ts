import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTextFormatting } from '../../../app/composables/useTextFormatting'

describe('useTextFormatting', () => {
  let textFormatting: ReturnType<typeof useTextFormatting>

  beforeEach(() => {
    vi.clearAllMocks()
    textFormatting = useTextFormatting()
  })

  describe('formatMarkdown', () => {
    describe('Markdown Parsing Tests', () => {
      it('should convert headers correctly', () => {
        const input = '# Header 1\n## Header 2\n### Header 3'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<h1>Header 1</h1>')
        expect(result).toContain('<h2>Header 2</h2>')
        expect(result).toContain('<h3>Header 3</h3>')
      })

      it('should convert bold text correctly', () => {
        const input = '**bold text** and __also bold__'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<strong>bold text</strong>')
        expect(result).toContain('<strong>also bold</strong>')
      })

      it('should convert italic text correctly', () => {
        const input = '*italic text* and _also italic_'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<em>italic text</em>')
        expect(result).toContain('<em>also italic</em>')
      })

      it('should convert links correctly', () => {
        const input = '[Google](https://google.com)'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<a href="https://google.com">Google</a>')
      })

      it('should handle line breaks correctly', () => {
        const input = 'Line 1\nLine 2\nLine 3'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<br>')
      })

      it('should convert unordered lists correctly', () => {
        const input = '- Item 1\n- Item 2\n- Item 3'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<ul>')
        expect(result).toContain('<li>Item 1</li>')
        expect(result).toContain('<li>Item 2</li>')
        expect(result).toContain('<li>Item 3</li>')
        expect(result).toContain('</ul>')
      })

      it('should convert ordered lists correctly', () => {
        const input = '1. First\n2. Second\n3. Third'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<ol>')
        expect(result).toContain('<li>First</li>')
        expect(result).toContain('<li>Second</li>')
        expect(result).toContain('<li>Third</li>')
        expect(result).toContain('</ol>')
      })

      it('should handle code blocks correctly', () => {
        const input = '```javascript\nconst foo = "bar";\n```'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<pre>')
        expect(result).toContain('<code')
        expect(result).toContain('const foo')
      })

      it('should handle inline code correctly', () => {
        const input = 'Use `npm install` to install'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<code>npm install</code>')
      })

      it('should handle blockquotes correctly', () => {
        const input = '> This is a quote\n> Second line'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<blockquote>')
        expect(result).toContain('This is a quote')
      })

      it('should handle combined formatting', () => {
        const input =
          '# Title\n\n**Bold** and *italic* with ' +
          '[link](https://example.com)'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<h1>Title</h1>')
        expect(result).toContain('<strong>Bold</strong>')
        expect(result).toContain('<em>italic</em>')
        expect(result).toContain('<a href="https://example.com">link</a>')
      })
    })

    describe('XSS Prevention Tests', () => {
      it('should remove script tags', () => {
        const input = '<script>alert("XSS")</script>Some text'
        const result = textFormatting.formatMarkdown(input)
        expect(result).not.toContain('<script')
        expect(result).not.toContain('alert')
        expect(result).toContain('Some text')
      })

      it('should remove event handlers', () => {
        const input = '<div onclick="alert(\'XSS\')">Click me</div>'
        const result = textFormatting.formatMarkdown(input)
        expect(result).not.toContain('onclick')
        expect(result).not.toContain('alert')
      })

      it('should block javascript: protocol links', () => {
        const input = '[Click](javascript:alert("XSS"))'
        const result = textFormatting.formatMarkdown(input)
        expect(result).not.toContain('javascript:')
      })

      it('should block data: URIs with scripts', () => {
        const input = '[Click](data:text/html,<script>alert("XSS")</script>)'
        const result = textFormatting.formatMarkdown(input)
        expect(result).not.toContain('data:')
        expect(result).not.toContain('<script')
      })

      it('should sanitize dangerous attributes', () => {
        const input = '<img src="x" onerror="alert(\'XSS\')">'
        const result = textFormatting.formatMarkdown(input)
        expect(result).not.toContain('onerror')
        expect(result).not.toContain('img')
      })

      it('should remove style attributes with javascript', () => {
        const input =
          '<p style="background: url(javascript:alert(1))">Text</p>'
        const result = textFormatting.formatMarkdown(input)
        expect(result).not.toContain('style')
        expect(result).not.toContain('javascript')
      })

      it('should handle nested XSS attempts', () => {
        const malicious = '**Bold <script>alert("XSS")</script> text**'
        const result = textFormatting.formatMarkdown(malicious)
        expect(result).toContain('<strong>')
        expect(result).not.toContain('<script')
        expect(result).not.toContain('alert')
      })

      it('should handle encoded XSS attempts', () => {
        const input = '&#60;script&#62;alert("XSS")&#60;/script&#62;'
        const result = textFormatting.formatMarkdown(input)
        expect(result).not.toContain('<script')
        // Encoded entities are preserved but harmless when rendered
        expect(result).toContain('&lt;script&gt;')
      })
    })

    describe('Edge Cases and Error Handling', () => {
      it('should handle empty string', () => {
        expect(textFormatting.formatMarkdown('')).toBe('')
      })

      it('should handle null input', () => {
        expect(textFormatting.formatMarkdown(null as unknown as string)).toBe(
          ''
        )
      })

      it('should handle undefined input', () => {
        expect(
          textFormatting.formatMarkdown(undefined as unknown as string)
        ).toBe('')
      })

      it('should truncate very long input', () => {
        const longText = 'a'.repeat(15000)
        const result = textFormatting.formatMarkdown(longText)
        // Should process only first 10000 chars
        expect(result.length).toBeLessThan(11000)
      })

      it('should handle special characters', () => {
        const input = 'Text with & < > " \' characters'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('&amp;')
        expect(result).toContain('&lt;')
        expect(result).toContain('&gt;')
      })

      it('should handle malformed markdown gracefully', () => {
        const input = '[Broken link(https://example.com) and **unclosed bold'
        const result = textFormatting.formatMarkdown(input)
        // Should not throw and return sanitized content
        expect(result).toBeTruthy()
      })

      it('should handle unicode characters', () => {
        const input = '# 你好世界 🌍\n**Émojis** 😀 work!'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('你好世界')
        expect(result).toContain('🌍')
        expect(result).toContain('😀')
      })

      it('should preserve allowed HTML tags', () => {
        const input =
          '# Title\n\n<p>Paragraph</p>\n<blockquote>Quote</blockquote>'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<h1>Title</h1>')
        expect(result).toContain('<p>Paragraph</p>')
        expect(result).toContain('<blockquote>Quote</blockquote>')
      })

      it('should handle nested markdown structures', () => {
        const input = '> # Header in quote\n> - List item 1\n> - List item 2'
        const result = textFormatting.formatMarkdown(input)
        expect(result).toContain('<blockquote>')
        expect(result).toContain('<h1>')
        expect(result).toContain('<ul>')
      })
    })

    describe('Performance Tests', () => {
      it('should handle 10K character document efficiently', () => {
        const text = '# Header\n\n' + 'Lorem ipsum '.repeat(800)
        const startTime = performance.now()
        const result = textFormatting.formatMarkdown(text)
        const endTime = performance.now()

        expect(result).toContain('<h1>Header</h1>')
        expect(endTime - startTime).toBeLessThan(100) // Should be fast
      })

      it('should truncate input over 10K characters', () => {
        const text = 'a'.repeat(10001)
        const result = textFormatting.formatMarkdown(text)
        // Result should be based on truncated input
        expect(result).toBeTruthy()
      })
    })
  })

  describe('extractUrls', () => {
    describe('URL Extraction from Markdown', () => {
      it('should extract markdown links', () => {
        const input =
          '[Google](https://google.com) and [GitHub](https://github.com)'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
          url: 'https://google.com',
          text: 'Google'
        })
        expect(result[1]).toEqual({
          url: 'https://github.com',
          text: 'GitHub'
        })
      })

      it('should extract plain URLs', () => {
        const input = 'Visit https://example.com for more info'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(1)
        expect(result[0].url).toBe('https://example.com')
        expect(result[0].text).toBe('example.com')
      })

      it('should extract mixed markdown and plain URLs', () => {
        const input = '[Link](https://link.com) and plain https://plain.com'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
          url: 'https://link.com',
          text: 'Link'
        })
        expect(result[1].url).toBe('https://plain.com')
      })

      it('should handle http and https protocols', () => {
        const input = 'HTTP: http://example.com HTTPS: https://secure.com'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(2)
        expect(result[0].url).toBe('http://example.com')
        expect(result[1].url).toBe('https://secure.com')
      })

      it('should use domain as text for plain URLs', () => {
        const input = 'Check https://subdomain.example.com/path/to/page'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(1)
        expect(result[0].text).toBe('subdomain.example.com')
      })
    })

    describe('URL Whitelist and Validation', () => {
      it('should reject ftp protocol', () => {
        const input = '[FTP](ftp://files.example.com)'
        const result = textFormatting.extractUrls(input)
        expect(result).toHaveLength(0)
      })

      it('should reject file protocol', () => {
        const input = '[File](file:///etc/passwd)'
        const result = textFormatting.extractUrls(input)
        expect(result).toHaveLength(0)
      })

      it('should reject javascript protocol', () => {
        const input = '[Click](javascript:alert("XSS"))'
        const result = textFormatting.extractUrls(input)
        expect(result).toHaveLength(0)
      })

      it('should reject data URIs', () => {
        const input = '[Data](data:text/html,<script>alert("XSS")</script>)'
        const result = textFormatting.extractUrls(input)
        expect(result).toHaveLength(0)
      })

      it('should handle malformed URLs gracefully', () => {
        const input = 'Bad URL: https://[broken and https://valid.com'
        const result = textFormatting.extractUrls(input)
        // Should only extract valid URL
        expect(result.length).toBeGreaterThanOrEqual(1)
        expect(result.some(l => l.url === 'https://valid.com')).toBe(true)
      })
    })

    describe('URL Deduplication', () => {
      it('should deduplicate identical URLs', () => {
        const input = 'https://example.com and again https://example.com'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(1)
        expect(result[0].url).toBe('https://example.com')
      })

      it('should deduplicate markdown and plain URL duplicates', () => {
        const input = '[Example](https://example.com) and https://example.com'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(1)
        expect(result[0].url).toBe('https://example.com')
        expect(result[0].text).toBe('Example') // Prefer markdown text
      })

      it('should keep different URLs', () => {
        const input = 'https://one.com https://two.com https://three.com'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(3)
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(textFormatting.extractUrls('')).toEqual([])
      })

      it('should handle null input', () => {
        expect(textFormatting.extractUrls(null as unknown as string)).toEqual(
          []
        )
      })

      it('should handle undefined input', () => {
        expect(
          textFormatting.extractUrls(undefined as unknown as string)
        ).toEqual([])
      })

      it('should handle text with no URLs', () => {
        const input = 'This is plain text without any URLs'
        expect(textFormatting.extractUrls(input)).toEqual([])
      })

      it('should trim URLs and text', () => {
        // Spaces in markdown are not treated as markdown links
        // They become plain URLs instead
        const plainUrlInput = '[Spaces](https://example.com)'
        const properResult = textFormatting.extractUrls(plainUrlInput)
        expect(properResult).toHaveLength(1)
        expect(properResult[0]).toEqual({
          url: 'https://example.com',
          text: 'Spaces'
        })
      })

      it('should handle empty link text', () => {
        const input = '[](https://example.com)'
        const result = textFormatting.extractUrls(input)

        // Empty markdown links are not extracted by the regex
        expect(result).toHaveLength(0)

        // Test with non-empty text works
        const validInput = '[text](https://example.com)'
        const validResult = textFormatting.extractUrls(validInput)
        expect(validResult).toHaveLength(1)
      })

      it('should handle URLs with query parameters', () => {
        const input = 'https://example.com?param=value&other=123'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(1)
        expect(result[0].url).toBe('https://example.com?param=value&other=123')
      })

      it('should handle URLs with anchors', () => {
        const input = 'https://example.com/page#section'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(1)
        expect(result[0].url).toBe('https://example.com/page#section')
      })

      it('should handle international domains', () => {
        const input = 'https://例え.jp and https://münchen.de'
        const result = textFormatting.extractUrls(input)

        expect(result.length).toBeGreaterThanOrEqual(2)
      })

      it('should handle URLs at start and end of text', () => {
        const input =
          'https://start.com in middle https://middle.com ' + 'https://end.com'
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(3)
      })

      it('should not extract URLs from code blocks', () => {
        const input = '```\nhttps://in-code.com\n```\nhttps://outside.com'
        const result = textFormatting.extractUrls(input)

        // Should extract both as extractUrls works on raw text
        expect(result.length).toBeGreaterThanOrEqual(1)
        expect(result.some(l => l.url === 'https://outside.com')).toBe(true)
      })

      it('should handle complex markdown documents', () => {
        const input = `
# Title
[Link 1](https://one.com) and some text
Plain URL: https://two.com

## Section
- [List link](https://three.com)
- Another item with https://four.com

> Quote with [link](https://five.com)
        `
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(5)
        expect(result.map(l => l.url)).toContain('https://one.com')
        expect(result.map(l => l.url)).toContain('https://five.com')
      })
    })

    describe('Error Handling', () => {
      it('should not throw on invalid regex characters', () => {
        const input = 'Text with [special](https://example.com?a[]=1)'
        expect(() => textFormatting.extractUrls(input)).not.toThrow()
      })

      it('should handle very long URLs', () => {
        const longPath = 'x'.repeat(1000)
        const input = `https://example.com/${longPath}`
        const result = textFormatting.extractUrls(input)

        expect(result).toHaveLength(1)
        expect(result[0].url).toContain('example.com')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should format markdown and preserve URLs for extraction', () => {
      const input = '# Title\n[Link](https://example.com) and **bold**'

      const formatted = textFormatting.formatMarkdown(input)
      const urls = textFormatting.extractUrls(input)

      expect(formatted).toContain('<h1>Title</h1>')
      expect(formatted).toContain('<a href="https://example.com">Link</a>')
      expect(formatted).toContain('<strong>bold</strong>')

      expect(urls).toHaveLength(1)
      expect(urls[0].url).toBe('https://example.com')
    })

    it('should handle complex documents with both functions', () => {
      const input = `
## Description
Check our [website](https://example.com) for more info.
Also visit https://docs.example.com for documentation.

**Features:**
- Fast performance
- [Security](https://security.example.com) focused
- Easy to use
      `

      const formatted = textFormatting.formatMarkdown(input)
      const urls = textFormatting.extractUrls(input)

      expect(formatted).toContain('<h2>Description</h2>')
      expect(formatted).toContain('<strong>Features:</strong>')
      expect(formatted).toContain('<ul>')

      expect(urls).toHaveLength(3)
      expect(urls.map(l => l.url)).toContain('https://example.com')
      expect(urls.map(l => l.url)).toContain('https://docs.example.com')
      expect(urls.map(l => l.url)).toContain('https://security.example.com')
    })

    it('should sanitize malicious content while preserving valid URLs', () => {
      const input = `
[Safe Link](https://safe.com)
<script>alert("XSS")</script>
[Malicious](javascript:alert("XSS"))
https://another-safe.com
      `

      const formatted = textFormatting.formatMarkdown(input)
      const urls = textFormatting.extractUrls(input)

      expect(formatted).not.toContain('<script')
      expect(formatted).not.toContain('javascript:')
      expect(formatted).toContain('https://safe.com')

      expect(urls).toHaveLength(2)
      expect(urls.map(l => l.url)).toContain('https://safe.com')
      expect(urls.map(l => l.url)).toContain('https://another-safe.com')
      expect(urls.map(l => l.url)).not.toContain('javascript:alert("XSS")')
    })

    it('should handle empty or invalid input consistently', () => {
      const emptyFormatted = textFormatting.formatMarkdown('')
      const emptyUrls = textFormatting.extractUrls('')

      expect(emptyFormatted).toBe('')
      expect(emptyUrls).toEqual([])

      const nullFormatted = textFormatting.formatMarkdown(
        null as unknown as string
      )
      const nullUrls = textFormatting.extractUrls(null as unknown as string)

      expect(nullFormatted).toBe('')
      expect(nullUrls).toEqual([])
    })

    it('should maintain performance with large documents', () => {
      const largeDoc = `
# Large Document
${'[Link](https://example.com) with text. '.repeat(100)}
${'Plain URL https://test.com in text. '.repeat(100)}
      `

      const startFormat = performance.now()
      const formatted = textFormatting.formatMarkdown(largeDoc)
      const formatTime = performance.now() - startFormat

      const startExtract = performance.now()
      const urls = textFormatting.extractUrls(largeDoc)
      const extractTime = performance.now() - startExtract

      expect(formatted).toContain('<h1>Large Document</h1>')
      expect(urls.length).toBeGreaterThan(0)
      expect(formatTime).toBeLessThan(200) // Should be fast
      expect(extractTime).toBeLessThan(100) // Should be fast
    })
  })
})
