import DOMPurify, { Config } from 'isomorphic-dompurify';

/**
 * Content Sanitization Library
 * 
 * Provides XSS prevention and content filtering for user-generated content.
 * Uses DOMPurify with a carefully curated whitelist of safe HTML tags and attributes.
 * 
 * Security Features:
 * - Prevents XSS attacks through strict tag filtering
 * - Allows safe formatting tags (bold, italic, links, code, etc.)
 * - Automatically secures external links with proper attributes
 * - Enforces maximum content length limits
 * - Removes dangerous tags (script, style, iframe, etc.)
 * - Normalizes link attributes for security
 * 
 * @example
 * ```typescript
 * // Basic message sanitization
 * const cleanMessage = sanitizeMessage("Hello <b>world</b>!");
 * // Returns: "Hello <b>world</b>!"
 *
 * // With external links (automatically secured)
 * const messageWithLink = sanitizeMessage('Visit <a href="https://example.com">our site</a>');
 * // Returns: 'Visit <a href="https://example.com" rel="noopener noreferrer" target="_blank">our site</a>'
 *
 * // Strip all HTML tags
 * const plainText = stripAll("Hello <b>world</b>!");
 * // Returns: "Hello world!"
 * ```
 */
const config: Config = {
  ALLOWED_TAGS: [
    'b',
    'i',
    'em',
    'strong',
    'a',
    'code',
    'pre',
    'br',
    'p',
    'ul',
    'ol',
    'li',
  ],
  ALLOWED_ATTR: ['href', 'title', 'rel', 'target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  USE_PROFILES: { html: true },
};

function normalizeLinks(html: string): string {
  // Ensure external links are safe (noopener/noreferrer) and avoid window.opener
  return html.replace(/<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi, (match, attrs) => {
    let updated = attrs;
    if (!/\brel=/.test(updated)) {
      updated += ' rel="noopener noreferrer"';
    }
    if (!/\btarget=/.test(updated)) {
      updated += ' target="_blank"';
    }
    return `<a ${updated}>`;
  });
}

/**
 * Sanitize user message content with XSS protection and safe HTML formatting
 * @param {string} input - Raw user input to sanitize
 * @param {number} [maxLength=1000] - Maximum allowed content length
 * @returns {string} Sanitized HTML string with safe formatting preserved
 */
export function sanitizeMessage(input: string, maxLength = 1000): string {
  const trimmed = (input ?? '').toString().slice(0, maxLength);
  const sanitized = DOMPurify.sanitize(trimmed, config);
  return normalizeLinks(sanitized);
}

/**
 * Strip all HTML tags from input, returning plain text only
 * @param {string} input - Raw user input to strip
 * @param {number} [maxLength=1000] - Maximum allowed content length
 * @returns {string} Plain text with all HTML tags removed
 */
export function stripAll(input: string, maxLength = 1000): string {
  const trimmed = (input ?? '').toString().slice(0, maxLength);
  return DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
