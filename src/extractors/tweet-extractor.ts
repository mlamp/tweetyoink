import { logger } from '../utils/logger';

/**
 * Main extraction orchestrator for tweet data
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

import type {
  TweetData,
  ExtractionResult,
  FieldExtractionResult,
} from '../types/tweet-data';
import { extractTweetText } from './text-extractor';
import { extractAuthor } from './author-extractor';
import { extractMetrics } from './metrics-extractor';
import { extractTimestamp } from './timestamp-extractor';
import { extractTweetType, extractQuotedTweetElement } from './tweet-type-extractor';
import { calculateConfidence, getExtractionTierLabel } from './confidence';
import { extractMedia } from './media-extractor';
import { extractLinkCard } from './linkcard-extractor';
import { extractTweetUrl } from './url-extractor';

/**
 * Expands truncated tweet text by clicking "Show more" button if present
 * @param tweetArticle - The tweet article element
 */
function expandTruncatedText(tweetArticle: Element): void {
  try {
    // Look for "Show more" button - Twitter uses data-testid="tweet-text-show-more-link"
    const showMoreButton = tweetArticle.querySelector(
      '[data-testid="tweet-text-show-more-link"]'
    ) as HTMLButtonElement;

    if (showMoreButton) {
      // Get the tweet text element to monitor changes
      const tweetTextElement = tweetArticle.querySelector('[data-testid="tweetText"]');
      const initialTextLength = tweetTextElement?.textContent?.length || 0;

      // Click the button - use multiple click strategies since Twitter may ignore programmatic clicks
      // Strategy 1: Try direct click
      showMoreButton.click();

      // Strategy 2: Dispatch mouse events to simulate real user interaction
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      showMoreButton.dispatchEvent(mouseDownEvent);
      showMoreButton.dispatchEvent(mouseUpEvent);
      showMoreButton.dispatchEvent(clickEvent);

      // Wait for the DOM to update - poll for changes with timeout
      // NOTE: We use polling instead of MutationObserver for simplicity and reliability:
      // - Polling guarantees we check conditions at the right time (after click events)
      // - MutationObserver would add complexity (setup, teardown, filtering mutations)
      // - This function runs rarely (only when "Show more" button exists)
      // - Twitter's DOM updates happen quickly (usually <100ms)
      // - The polling loop doesn't block (no busy-wait delays)
      const maxWaitMs = 2000; // Maximum 2 seconds wait
      const startTime = performance.now();
      let lastTextLength = initialTextLength;

      while (performance.now() - startTime < maxWaitMs) {
        // Check if button is gone (indicates expansion completed)
        const buttonStillExists = tweetArticle.querySelector('[data-testid="tweet-text-show-more-link"]');
        const currentTextLength = tweetTextElement?.textContent?.length || 0;

        // Success condition: button gone AND text grew
        if (!buttonStillExists && currentTextLength > initialTextLength) {
          return;
        }

        // Also check if text is still growing (button might take time to disappear)
        if (currentTextLength > lastTextLength) {
          lastTextLength = currentTextLength;
        }

        // No artificial delay - let the browser's event loop handle timing naturally
        // The outer while loop will re-check as fast as needed without blocking
      }
    }
  } catch (error) {
    logger.warn('[TweetExtractor] Failed to expand truncated text:', error);
    // Non-critical error - continue with extraction even if expansion fails
  }
}

/**
 * Extracts complete tweet data from article element
 * @param tweetArticle - The tweet article element
 * @param depth - Recursion depth to prevent infinite loops (max 3 levels)
 * @returns ExtractionResult with TweetData or error
 */
export function extractTweetData(
  tweetArticle: Element,
  depth: number = 0
): ExtractionResult {
  // Prevent infinite recursion (max 3 levels: tweet -> quote -> nested quote)
  const MAX_DEPTH = 3;
  if (depth >= MAX_DEPTH) {
    logger.warn('[TweetYoink] Max extraction depth reached, stopping recursion');
    return {
      success: false,
      data: null,
      error: {
        code: 'MAX_DEPTH_EXCEEDED',
        message: 'Maximum extraction depth exceeded',
        failedFields: [],
        context: { depth },
      },
    };
  }
  const startTime = performance.now();
  const warnings: string[] = [];
  const fieldResults: FieldExtractionResult[] = [];

  try {
    // Expand truncated text before extraction
    // Note: expandTruncatedText already handles waiting for DOM updates via polling
    expandTruncatedText(tweetArticle);

    // Extract text
    let text = extractTweetText(tweetArticle);
    fieldResults.push({
      name: 'text',
      extracted: text !== null,
      tier: 'primary', // Simplified for MVP - would track actual tier used
    });

    // Extract media first (needed for text fallback)
    const media = extractMedia(tweetArticle);

    // Fallback: use image altText if no text content found
    if (text === null && media.length > 0) {
      const firstImageWithAlt = media.find(m => m.type === 'image' && m.altText);
      if (firstImageWithAlt?.altText) {
        text = firstImageWithAlt.altText;
        warnings.push('Using image altText as tweet text (image-only tweet)');
      } else {
        warnings.push('Failed to extract tweet text');
      }
    } else if (text === null) {
      warnings.push('Failed to extract tweet text');
    }

    // Extract author
    const author = extractAuthor(tweetArticle);
    fieldResults.push({
      name: 'author',
      extracted: author.handle !== null,
      tier: 'primary',
    });
    if (author.handle === null) {
      warnings.push('Failed to extract author handle');
    }

    // Extract timestamp
    const timestamp = extractTimestamp(tweetArticle);
    fieldResults.push({
      name: 'timestamp',
      extracted: timestamp !== null,
      tier: 'primary',
    });
    if (timestamp === null) {
      warnings.push('Failed to extract timestamp');
    }

    // Extract tweet URL
    const url = extractTweetUrl(tweetArticle);
    fieldResults.push({
      name: 'url',
      extracted: url !== null,
      tier: 'primary',
    });
    if (url === null) {
      warnings.push('Failed to extract tweet URL');
    }

    // Extract metrics
    const metrics = extractMetrics(tweetArticle);
    const metricsExtracted =
      metrics.replyCount !== null ||
      metrics.retweetCount !== null ||
      metrics.likeCount !== null;
    fieldResults.push({
      name: 'metrics',
      extracted: metricsExtracted,
      tier: 'primary',
    });
    if (!metricsExtracted) {
      warnings.push('Failed to extract engagement metrics');
    }

    // Extract tweet type (quote, retweet, reply)
    const tweetType = extractTweetType(tweetArticle);
    fieldResults.push({
      name: 'tweetType',
      extracted: true, // Always succeeds with default false values
      tier: 'primary',
    });

    // Extract parent tweet if this is a quote tweet
    let parent: TweetData | null = null;
    if (tweetType.isQuote) {
      const quotedElement = extractQuotedTweetElement(tweetArticle);
      if (quotedElement) {
        // Recursively extract the quoted tweet
        const parentResult = extractTweetData(quotedElement, depth + 1);
        if (parentResult.success && parentResult.data) {
          parent = parentResult.data;
        } else {
          warnings.push('Failed to extract quoted tweet data');
        }
      } else {
        warnings.push('Quote tweet detected but could not find quoted element');
      }
    }

    fieldResults.push({
      name: 'parent',
      extracted: parent !== null || !tweetType.isQuote,
      tier: 'primary',
    });

    // Media already extracted earlier (for text fallback)
    fieldResults.push({
      name: 'media',
      extracted: media.length > 0,
      tier: 'primary',
    });

    // Extract link card
    const linkCard = extractLinkCard(tweetArticle);
    fieldResults.push({
      name: 'linkCard',
      extracted: linkCard !== null,
      tier: 'primary',
    });

    // Calculate confidence (use adjusted weights for nested tweets)
    const isNested = depth > 0;
    const confidence = calculateConfidence(fieldResults, isNested);
    const extractionTier = getExtractionTierLabel(confidence);

    // Calculate duration
    const duration = Math.round(performance.now() - startTime);

    const tweetData: TweetData = {
      text,
      url,
      author,
      timestamp,
      metrics,
      media,
      linkCard,
      tweetType,
      parent,
      metadata: {
        confidence,
        capturedAt: new Date().toISOString(),
        extractionTier,
        warnings,
        duration,
      },
    };

    return {
      success: true,
      data: tweetData,
      error: null,
    };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('[TweetYoink] Extraction failed:', error);

    return {
      success: false,
      data: null,
      error: {
        code: 'EXTRACTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        failedFields: fieldResults
          .filter((r) => !r.extracted)
          .map((r) => r.name),
        context: {
          duration,
          warnings,
        },
      },
    };
  }
}
