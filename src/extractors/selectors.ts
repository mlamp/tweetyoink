/**
 * Centralized selector definitions for tweet data extraction
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/research.md and data-model.md
 *
 * Selector tiers:
 * - Primary: data-testid attributes (confidence 0.95-1.0)
 * - Secondary: aria-label + role patterns (confidence 0.70-0.85)
 * - Tertiary: structural CSS selectors (confidence 0.40-0.60)
 */

import type { SelectorConfig } from '../types/tweet-data';

/**
 * Tweet text content selectors
 */
export const tweetTextSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="tweetText"]',
    type: 'css',
    extractor: (el) => el.textContent?.trim() || null,
    confidence: 0.95,
  },
  secondary: {
    selector: 'article[role="article"] div[lang][dir]',
    type: 'css',
    extractor: (el) => el.textContent?.trim() || null,
    confidence: 0.75,
  },
  tertiary: {
    selector: 'article[role="article"] > div > div:nth-child(2) > div:nth-child(2)',
    type: 'css',
    extractor: (el) => {
      // Find div with lang attribute within this container
      const textDiv = el.querySelector('div[lang]');
      return textDiv?.textContent?.trim() || null;
    },
    confidence: 0.50,
  },
};

/**
 * Author handle (username) selectors
 */
export const authorHandleSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="User-Name"] a[href^="/"] span',
    type: 'css',
    extractor: (el) => {
      const text = el.textContent?.trim() || null;
      // Remove @ prefix if present
      return text?.startsWith('@') ? text.substring(1) : text;
    },
    validator: (value) => /^[A-Za-z0-9_]{1,15}$/.test(value),
    confidence: 0.95,
  },
  secondary: {
    selector: 'a[href^="/"][role="link"]',
    type: 'css',
    extractor: (el) => {
      const href = el.getAttribute('href');
      if (!href || href === '/') return null;
      // Extract handle from href (e.g., "/username" -> "username")
      const match = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
      return match ? match[1] : null;
    },
    validator: (value) => /^[A-Za-z0-9_]{1,15}$/.test(value),
    confidence: 0.80,
  },
  tertiary: {
    selector: '[data-testid="User-Name"]',
    type: 'css',
    extractor: (el) => {
      // Look for @username pattern in any text node
      const allText = el.textContent || '';
      const match = allText.match(/@([A-Za-z0-9_]{1,15})/);
      return match ? match[1] : null;
    },
    validator: (value) => /^[A-Za-z0-9_]{1,15}$/.test(value),
    confidence: 0.60,
  },
};

/**
 * Author display name selectors
 */
export const authorDisplayNameSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="User-Name"] > div:first-child span',
    type: 'css',
    extractor: (el) => el.textContent?.trim() || null,
    confidence: 0.95,
  },
  secondary: {
    selector: 'article[role="article"] a[href^="/"][role="link"] > div > span',
    type: 'css',
    extractor: (el) => {
      const text = el.textContent?.trim();
      // Filter out @ mentions (those are handles, not display names)
      return text && !text.startsWith('@') ? text : null;
    },
    confidence: 0.75,
  },
  tertiary: null,
};

/**
 * Author verification badge selectors
 */
export const authorVerifiedSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="User-Name"] [data-testid="icon-verified"]',
    type: 'css',
    extractor: (el) => (el ? 'true' : null),
    confidence: 0.98,
  },
  secondary: {
    selector: 'article[role="article"] svg[aria-label*="Verified"]',
    type: 'css',
    extractor: (el) => (el ? 'true' : null),
    confidence: 0.85,
  },
  tertiary: null,
};

/**
 * Author profile image URL selectors
 */
export const authorProfileImageSelector: SelectorConfig = {
  primary: {
    selector: 'article[role="article"] img[alt][src*="profile_images"]',
    type: 'css',
    extractor: (el) => el.getAttribute('src'),
    validator: (value) => value.startsWith('http'),
    confidence: 0.90,
  },
  secondary: {
    selector: 'article[role="article"] a[href^="/"] img[src]',
    type: 'css',
    extractor: (el) => el.getAttribute('src'),
    validator: (value) => value.startsWith('http'),
    confidence: 0.75,
  },
  tertiary: null,
};

/**
 * Tweet timestamp selectors
 */
export const timestampSelector: SelectorConfig = {
  primary: {
    selector: 'time[datetime]',
    type: 'css',
    extractor: (el) => el.getAttribute('datetime'),
    validator: (value) => {
      // Validate ISO 8601 format
      try {
        const date = new Date(value);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    },
    confidence: 0.98,
  },
  secondary: {
    selector: 'article[role="article"] a[href*="/status/"] time',
    type: 'css',
    extractor: (el) => {
      // Try to parse from text content if datetime attribute missing
      const text = el.textContent?.trim();
      if (!text) return null;
      try {
        const date = new Date(text);
        return !isNaN(date.getTime()) ? date.toISOString() : null;
      } catch {
        return null;
      }
    },
    confidence: 0.60,
  },
  tertiary: null,
};

/**
 * Reply count selectors
 */
export const replyCountSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="reply"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      // Extract from "48 Replies. Reply" format
      const match = label?.match(/^(\d+)\s+repl/i);
      return match ? match[1] : null;
    },
    confidence: 0.90,
  },
  secondary: {
    selector: 'article[role="article"] button[aria-label*="repl"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      const match = label?.match(/(\d+)\s+repl/i);
      return match ? match[1] : null;
    },
    confidence: 0.75,
  },
  tertiary: null,
};

/**
 * Retweet count selectors
 */
export const retweetCountSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="retweet"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      // Extract from "152 reposts. Repost" format
      const match = label?.match(/^(\d+)\s+repost/i);
      return match ? match[1] : null;
    },
    confidence: 0.90,
  },
  secondary: {
    selector: 'article[role="article"] button[aria-label*="repost"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      const match = label?.match(/(\d+)\s+repost/i);
      return match ? match[1] : null;
    },
    confidence: 0.75,
  },
  tertiary: null,
};

/**
 * Like count selectors
 */
export const likeCountSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="like"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      // Extract from "553 Likes. Like" format
      const match = label?.match(/^(\d+)\s+like/i);
      return match ? match[1] : null;
    },
    confidence: 0.90,
  },
  secondary: {
    selector: 'article[role="article"] button[aria-label*="like"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      const match = label?.match(/(\d+)\s+like/i);
      return match ? match[1] : null;
    },
    confidence: 0.75,
  },
  tertiary: null,
};

/**
 * Bookmark count selectors (note: often hidden/unavailable)
 */
export const bookmarkCountSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="bookmark"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      // Extract from "9 Bookmarks. Bookmark" format
      const match = label?.match(/^(\d+)\s+bookmark/i);
      return match ? match[1] : null;
    },
    confidence: 0.85,
  },
  secondary: {
    selector: 'article[role="article"] button[aria-label*="bookmark"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      const match = label?.match(/(\d+)\s+bookmark/i);
      return match ? match[1] : null;
    },
    confidence: 0.70,
  },
  tertiary: null,
};

/**
 * View count selectors
 */
export const viewCountSelector: SelectorConfig = {
  primary: {
    selector: 'a[href*="/analytics"] [data-testid*="count"]',
    type: 'css',
    extractor: (el) => el.getAttribute('aria-label') || el.textContent?.trim() || null,
    confidence: 0.90,
  },
  secondary: {
    selector: 'article[role="article"] [aria-label*="view"]',
    type: 'css',
    extractor: (el) => {
      const label = el.getAttribute('aria-label');
      const match = label?.match(/([\d,]+)\s+view/i);
      return match ? match[1] : null;
    },
    confidence: 0.75,
  },
  tertiary: null,
};
