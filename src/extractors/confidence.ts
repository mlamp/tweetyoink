/**
 * Confidence score calculation for tweet extraction quality
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 *
 * Algorithm: Weighted sum based on field criticality and selector tier used
 */

import type { FieldExtractionResult, ExtractionTier } from '../types/tweet-data';

/**
 * Field weights for confidence calculation
 * Critical fields (text, author) have higher weights
 */
const FIELD_WEIGHTS: Record<string, number> = {
  text: 0.30,        // Critical field
  author: 0.25,      // Critical field (includes handle, displayName, verified, profileImage)
  timestamp: 0.15,
  metrics: 0.10,     // Includes all metric counts
  media: 0.10,
  linkCard: 0.05,
  tweetType: 0.05,
};

/**
 * Tier multipliers for confidence calculation
 * Primary selectors get full weight, secondary/tertiary are penalized
 */
const TIER_MULTIPLIERS: Record<ExtractionTier, number> = {
  primary: 1.0,
  secondary: 0.75,
  tertiary: 0.50,
};

/**
 * Calculates overall confidence score for extraction result
 * @param results - Array of field extraction results
 * @param isNested - Whether this is a nested tweet (quoted/parent tweet)
 * @returns Confidence score between 0.0 and 1.0
 */
export function calculateConfidence(
  results: FieldExtractionResult[],
  isNested: boolean = false
): number {
  let totalScore = 0;

  // For nested tweets, use adjusted weights (metrics less important)
  const weights = isNested
    ? {
        text: 0.40,        // More important for nested
        author: 0.35,      // More important for nested
        timestamp: 0.15,
        metrics: 0.02,     // Less important (often not visible)
        media: 0.05,
        linkCard: 0.02,
        tweetType: 0.01,
      }
    : FIELD_WEIGHTS;

  for (const result of results) {
    const weight = weights[result.name] || 0;

    if (!result.extracted) {
      // Field not extracted - contributes 0 to score
      continue;
    }

    const tierMultiplier = TIER_MULTIPLIERS[result.tier];
    const fieldScore = weight * tierMultiplier;
    totalScore += fieldScore;
  }

  // Clamp to [0, 1] range
  return Math.max(0, Math.min(1, totalScore));
}

/**
 * Determines extraction tier label based on confidence score
 * @param confidence - Confidence score (0.0-1.0)
 * @returns Tier label for metadata
 */
export function getExtractionTierLabel(confidence: number): ExtractionTier {
  if (confidence >= 0.90) {
    return 'primary'; // Excellent quality
  } else if (confidence >= 0.70) {
    return 'secondary'; // Good quality
  } else {
    return 'tertiary'; // Acceptable/poor quality
  }
}

/**
 * Validates confidence score threshold for minimum viable extraction
 * @param confidence - Confidence score (0.0-1.0)
 * @returns True if extraction meets minimum quality threshold
 */
export function meetsMinimumConfidence(confidence: number): boolean {
  // Minimum threshold: 0.50 (at least critical fields extracted)
  return confidence >= 0.50;
}

/**
 * Helper to parse numeric metrics from extracted strings
 * Handles formatted numbers like "1.2K", "3M", "10,500"
 * @param value - Raw string value from extraction
 * @returns Parsed number or null
 */
export function parseMetricCount(value: string | null): number | null {
  if (!value) return null;

  // Remove commas and whitespace
  let cleaned = value.replace(/,/g, '').trim();

  // Handle K/M suffixes
  const kMatch = cleaned.match(/^([\d.]+)K$/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  const mMatch = cleaned.match(/^([\d.]+)M$/i);
  if (mMatch) {
    return Math.round(parseFloat(mMatch[1]) * 1000000);
  }

  // Try direct parse
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
