import { logger } from '../utils/logger';

/**
 * Response Handler Service
 * Feature: 004-response-overlay
 *
 * Parses server responses and filters content items for overlay display
 */

import type { ResponseContentItem } from '../types/overlay';
import type { PostResponse } from '../types/config';

export interface ParsedResponse {
  /** Whether response has displayable content */
  hasContent: boolean;

  /** Filtered content items (type="text" only) */
  contentItems: ResponseContentItem[];

  /** Reason for no content (if hasContent is false) */
  emptyReason?: 'empty-array' | 'no-text-items' | 'non-array-result' | 'error-response';
}

/**
 * Parse server response and extract displayable content items
 *
 * @param response - Server response from POST /tweets or polling
 * @returns Parsed response with filtered content items
 */
export function parseServerResponse(response: PostResponse): ParsedResponse {
  // Handle error responses - no overlay display
  if (response.status === 'failed' || response.status === 'error') {
    logger.log('[ResponseHandler] Error response - no overlay display');
    return {
      hasContent: false,
      contentItems: [],
      emptyReason: 'error-response',
    };
  }

  // Handle pending/processing responses - no result yet
  if (response.status === 'pending' || response.status === 'processing') {
    logger.log('[ResponseHandler] Async response pending - no result yet');
    return {
      hasContent: false,
      contentItems: [],
      emptyReason: 'error-response', // Treat as no content (async will complete later)
    };
  }

  // Handle completed responses
  if (response.status === 'completed') {
    const { result } = response;

    // Check if result is an array (new format)
    if (Array.isArray(result)) {
      logger.debug(`[ResponseHandler] Received array with ${result.length} items`);

      // Empty array
      if (result.length === 0) {
        return {
          hasContent: false,
          contentItems: [],
          emptyReason: 'empty-array',
        };
      }

      // Validate and filter content items
      const validatedItems = result
        .map((item, index) => {
          // Validate item structure
          if (!isValidContentItem(item)) {
            logger.warn(`[ResponseHandler] Invalid content item at index ${index}:`, item);
            return null;
          }
          return item as ResponseContentItem;
        })
        .filter((item): item is ResponseContentItem => item !== null);

      logger.debug(`[ResponseHandler] Validated ${validatedItems.length} items`);

      // Filter for displayable items (type="text" and type="image")
      const displayableItems = validatedItems.filter((item) => {
        if (item.type === 'text' || item.type === 'image') {
          return true;
        } else {
          logger.debug(`[ResponseHandler] Skipping unsupported item type (type="${item.type}")`);
          return false;
        }
      });

      logger.debug(`[ResponseHandler] Found ${displayableItems.length} displayable items (text + image)`);

      // No displayable items after filtering
      if (displayableItems.length === 0) {
        return {
          hasContent: false,
          contentItems: [],
          emptyReason: 'no-text-items',
        };
      }

      // Success - we have content to display
      return {
        hasContent: true,
        contentItems: displayableItems,
      };
    } else {
      // Legacy format (non-array result)
      logger.log('[ResponseHandler] Legacy format detected (non-array result) - no overlay display');
      logger.log('[ResponseHandler] Result:', result);
      return {
        hasContent: false,
        contentItems: [],
        emptyReason: 'non-array-result',
      };
    }
  }

  // Fallback for unexpected status values
  logger.warn('[ResponseHandler] Unexpected response status:', response);
  return {
    hasContent: false,
    contentItems: [],
    emptyReason: 'error-response',
  };
}

/**
 * Validate if an item matches ResponseContentItem interface
 *
 * @param item - Item to validate
 * @returns True if item has required fields
 */
function isValidContentItem(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const obj = item as Record<string, unknown>;

  // Required fields
  if (typeof obj.type !== 'string') {
    return false;
  }

  if (typeof obj.content !== 'string') {
    return false;
  }

  // Optional metadata (if present, must be object)
  if (obj.metadata !== undefined) {
    if (typeof obj.metadata !== 'object' || obj.metadata === null) {
      return false;
    }
  }

  return true;
}

/**
 * Get human-readable message for empty state
 *
 * @param emptyReason - Reason code for empty state
 * @returns Message to display in overlay
 */
export function getEmptyStateMessage(emptyReason: ParsedResponse['emptyReason']): string {
  switch (emptyReason) {
    case 'empty-array':
      return 'No results available';
    case 'no-text-items':
      return 'No displayable content';
    case 'non-array-result':
      return 'Response format not supported for overlay display';
    case 'error-response':
      return 'Unable to display content';
    default:
      return 'No content to display';
  }
}
