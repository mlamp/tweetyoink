import { logger } from '../utils/logger';

/**
 * Selector fallback chain for defensive DOM extraction
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/research.md
 *
 * Implements three-tier fallback strategy:
 * 1. Primary: data-testid attributes (confidence 0.95-1.0)
 * 2. Secondary: aria-label + role patterns (confidence 0.70-0.85)
 * 3. Tertiary: structural CSS selectors (confidence 0.40-0.60)
 */

import type {
  SelectorConfig,
  SelectorStrategy,
  ExtractionTier,
} from '../types/tweet-data';

/**
 * Result of a single field extraction attempt
 */
export interface ExtractionAttempt<T = string> {
  value: T | null;
  tier: ExtractionTier | null;
  confidence: number;
  warnings: string[];
}

/**
 * SelectorFallbackChain orchestrates extraction attempts across multiple selector tiers
 */
export class SelectorFallbackChain {
  /**
   * Attempts extraction using the three-tier fallback strategy
   * @param config - Selector configuration with primary/secondary/tertiary strategies
   * @param rootElement - Root element to search within
   * @returns Extraction result with value, tier, confidence, and warnings
   */
  static extract<T = string>(
    config: SelectorConfig,
    rootElement: Element
  ): ExtractionAttempt<T> {
    const warnings: string[] = [];

    // Try primary selector
    const primaryResult = this.tryExtraction<T>(
      config.primary,
      rootElement,
      'primary'
    );
    if (primaryResult.value !== null) {
      return {
        value: primaryResult.value,
        tier: 'primary',
        confidence: config.primary.confidence,
        warnings,
      };
    }
    warnings.push(
      `Primary selector failed: ${config.primary.selector}`
    );

    // Try secondary selector
    if (config.secondary) {
      const secondaryResult = this.tryExtraction<T>(
        config.secondary,
        rootElement,
        'secondary'
      );
      if (secondaryResult.value !== null) {
        return {
          value: secondaryResult.value,
          tier: 'secondary',
          confidence: config.secondary.confidence,
          warnings,
        };
      }
      warnings.push(
        `Secondary selector failed: ${config.secondary.selector}`
      );
    }

    // Try tertiary selector
    if (config.tertiary) {
      const tertiaryResult = this.tryExtraction<T>(
        config.tertiary,
        rootElement,
        'tertiary'
      );
      if (tertiaryResult.value !== null) {
        return {
          value: tertiaryResult.value,
          tier: 'tertiary',
          confidence: config.tertiary.confidence,
          warnings,
        };
      }
      warnings.push(
        `Tertiary selector failed: ${config.tertiary.selector}`
      );
    }

    // All selectors failed
    return {
      value: null,
      tier: null,
      confidence: 0,
      warnings,
    };
  }

  /**
   * Attempts extraction using a single selector strategy
   * @param strategy - Selector strategy to use
   * @param rootElement - Root element to search within
   * @param tier - Current tier being attempted
   * @returns Extraction result with value
   */
  private static tryExtraction<T = string>(
    strategy: SelectorStrategy,
    rootElement: Element,
    tier: ExtractionTier
  ): { value: T | null } {
    try {
      // Find element using selector
      let targetElement: Element | null = null;

      if (strategy.type === 'css') {
        targetElement = rootElement.querySelector(strategy.selector);
      } else if (strategy.type === 'xpath') {
        const xpathResult = document.evaluate(
          strategy.selector,
          rootElement,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        targetElement = xpathResult.singleNodeValue as Element | null;
      } else if (strategy.type === 'text') {
        // Text type uses the root element itself
        targetElement = rootElement;
      }

      if (!targetElement) {
        return { value: null };
      }

      // Extract value using extractor function
      const extractedValue = strategy.extractor(targetElement);

      if (extractedValue === null || extractedValue === '') {
        return { value: null };
      }

      // Validate if validator provided
      if (strategy.validator && !strategy.validator(extractedValue)) {
        return { value: null };
      }

      return { value: extractedValue as T };
    } catch (error) {
      // Log error but don't throw - defensive extraction
      logger.warn(
        `[TweetYoink] Extraction failed for ${tier} selector: ${strategy.selector}`,
        error
      );
      return { value: null };
    }
  }

  /**
   * Extracts multiple elements matching a selector (for arrays like media)
   * @param config - Selector configuration
   * @param rootElement - Root element to search within
   * @returns Array extraction result
   */
  static extractMultiple<T = string>(
    config: SelectorConfig,
    rootElement: Element
  ): ExtractionAttempt<T[]> {
    const warnings: string[] = [];

    // Try primary selector
    const primaryResult = this.tryMultipleExtraction<T>(
      config.primary,
      rootElement,
      'primary'
    );
    if (primaryResult.values.length > 0) {
      return {
        value: primaryResult.values,
        tier: 'primary',
        confidence: config.primary.confidence,
        warnings,
      };
    }
    warnings.push(
      `Primary selector found no elements: ${config.primary.selector}`
    );

    // Try secondary selector
    if (config.secondary) {
      const secondaryResult = this.tryMultipleExtraction<T>(
        config.secondary,
        rootElement,
        'secondary'
      );
      if (secondaryResult.values.length > 0) {
        return {
          value: secondaryResult.values,
          tier: 'secondary',
          confidence: config.secondary.confidence,
          warnings,
        };
      }
      warnings.push(
        `Secondary selector found no elements: ${config.secondary.selector}`
      );
    }

    // Try tertiary selector
    if (config.tertiary) {
      const tertiaryResult = this.tryMultipleExtraction<T>(
        config.tertiary,
        rootElement,
        'tertiary'
      );
      if (tertiaryResult.values.length > 0) {
        return {
          value: tertiaryResult.values,
          tier: 'tertiary',
          confidence: config.tertiary.confidence,
          warnings,
        };
      }
      warnings.push(
        `Tertiary selector found no elements: ${config.tertiary.selector}`
      );
    }

    // All selectors failed - return empty array
    return {
      value: [],
      tier: null,
      confidence: 0,
      warnings,
    };
  }

  /**
   * Attempts extraction of multiple elements using a single selector strategy
   * @param strategy - Selector strategy to use
   * @param rootElement - Root element to search within
   * @param tier - Current tier being attempted
   * @returns Array of extracted values
   */
  private static tryMultipleExtraction<T = string>(
    strategy: SelectorStrategy,
    rootElement: Element,
    tier: ExtractionTier
  ): { values: T[] } {
    try {
      let elements: Element[] = [];

      if (strategy.type === 'css') {
        elements = Array.from(rootElement.querySelectorAll(strategy.selector));
      } else if (strategy.type === 'xpath') {
        const xpathResult = document.evaluate(
          strategy.selector,
          rootElement,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        for (let i = 0; i < xpathResult.snapshotLength; i++) {
          const node = xpathResult.snapshotItem(i);
          if (node instanceof Element) {
            elements.push(node);
          }
        }
      }

      if (elements.length === 0) {
        return { values: [] };
      }

      // Extract values from all elements
      const values: T[] = [];
      for (const element of elements) {
        const extractedValue = strategy.extractor(element);
        if (extractedValue !== null && extractedValue !== '') {
          // Validate if validator provided
          if (!strategy.validator || strategy.validator(extractedValue)) {
            values.push(extractedValue as T);
          }
        }
      }

      return { values };
    } catch (error) {
      logger.warn(
        `[TweetYoink] Multiple extraction failed for ${tier} selector: ${strategy.selector}`,
        error
      );
      return { values: [] };
    }
  }
}
