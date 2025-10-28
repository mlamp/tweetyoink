/**
 * Link card extractor for preview cards
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

import type { LinkCardData } from '../types/tweet-data';

/**
 * Extracts link card preview data from tweet article element
 * @param tweetArticle - The tweet article element
 * @returns LinkCardData object or null if no link card found
 */
export function extractLinkCard(tweetArticle: Element): LinkCardData | null {
  // Primary: data-testid="card.wrapper"
  const cardWrapper = tweetArticle.querySelector('[data-testid="card.wrapper"]');

  if (!cardWrapper) {
    return null;
  }

  // Extract URL from the card link
  const cardLink = cardWrapper.querySelector('a[href]');
  const url = cardLink?.getAttribute('href') || null;

  if (!url) {
    return null;
  }

  // Extract title
  // Link cards typically have the title in a specific text element
  const titleElement = cardWrapper.querySelector('[data-testid="card.layoutLarge.detail"] > div:first-child span') ||
                       cardWrapper.querySelector('[data-testid="card.layoutSmall.detail"] span');
  const title = titleElement?.textContent?.trim() || null;

  // Extract description
  // Description is usually in a second div or span
  const descriptionElement = cardWrapper.querySelector('[data-testid="card.layoutLarge.detail"] > div:nth-child(2)') ||
                             cardWrapper.querySelector('[data-testid="card.layoutSmall.detail"] > div:last-child');
  const description = descriptionElement?.textContent?.trim() || null;

  // Extract image URL
  const cardImage = cardWrapper.querySelector('[data-testid="card.layoutLarge.media"] img') ||
                    cardWrapper.querySelector('img[src]');
  const imageUrl = cardImage?.getAttribute('src') || null;

  // Extract domain
  // Domain is often displayed separately or can be parsed from URL
  let domain: string | null = null;

  // Try to find domain text element first
  const domainElements = cardWrapper.querySelectorAll('span');
  for (let i = 0; i < domainElements.length; i++) {
    const text = domainElements[i].textContent?.trim() || '';
    // Look for domain-like patterns (e.g., "example.com")
    if (text.includes('.') && text.length < 50 && !text.includes(' ')) {
      domain = text;
      break;
    }
  }

  // Fallback: parse domain from URL
  if (!domain && url) {
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } catch (e) {
      // Invalid URL, domain remains null
    }
  }

  return {
    url,
    title,
    description,
    imageUrl,
    domain,
  };
}
