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
    console.warn('[TweetYoink] Max extraction depth reached, stopping recursion');
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
    // Extract text
    const text = extractTweetText(tweetArticle);
    fieldResults.push({
      name: 'text',
      extracted: text !== null,
      tier: 'primary', // Simplified for MVP - would track actual tier used
    });
    if (text === null) {
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

    // Extract media (images, videos, GIFs)
    const media = extractMedia(tweetArticle);
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

    console.error('[TweetYoink] Extraction failed:', error);

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
