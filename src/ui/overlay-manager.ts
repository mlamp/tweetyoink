import { logger } from '../utils/logger';

/**
 * Overlay Manager
 * Feature: 004-response-overlay
 *
 * Singleton manager for overlay lifecycle (show, hide, cleanup)
 */

import type { ResponseContentItem, OverlayState } from '../types/overlay';
import { DEFAULT_OVERLAY_CONFIG } from '../types/overlay';
import { renderOverlay, renderEmptyStateOverlay } from './overlay-renderer';

/**
 * Singleton overlay manager instance
 */
let overlayState: OverlayState | null = null;

/**
 * DOM elements for current overlay (if visible)
 */
let overlayElements: {
  backdrop: HTMLElement;
  container: HTMLElement;
} | null = null;

/**
 * Show overlay with content items
 *
 * @param contentItems - Array of content items to display
 * @param associatedTweetId - Tweet ID that triggered this overlay
 */
export function showOverlay(contentItems: ResponseContentItem[], associatedTweetId: string): void {
  logger.log('[OverlayManager] Showing overlay with', contentItems.length, 'items');

  // Close existing overlay if present (singleton pattern)
  if (overlayState?.isVisible) {
    logger.log('[OverlayManager] Closing existing overlay before showing new one');
    closeOverlay();
  }

  // Create new overlay state
  overlayState = {
    isVisible: true,
    contentItems,
    associatedTweetId,
    createdAt: Date.now(),
  };

  // Render overlay to DOM
  const elements = renderOverlay(contentItems, DEFAULT_OVERLAY_CONFIG);
  overlayElements = elements;

  // Attach event listeners for dismissal
  attachEventListeners();

  logger.log('[OverlayManager] Overlay displayed successfully');
}

/**
 * Show overlay with empty state message
 *
 * @param message - Empty state message to display
 * @param associatedTweetId - Tweet ID that triggered this overlay
 */
export function showEmptyStateOverlay(message: string, associatedTweetId: string): void {
  logger.log('[OverlayManager] Showing empty state overlay with message:', message);

  // Close existing overlay if present (singleton pattern)
  if (overlayState?.isVisible) {
    logger.log('[OverlayManager] Closing existing overlay before showing new one');
    closeOverlay();
  }

  // Create new overlay state (with empty contentItems array)
  overlayState = {
    isVisible: true,
    contentItems: [],
    associatedTweetId,
    createdAt: Date.now(),
  };

  // Render empty state overlay to DOM
  const elements = renderEmptyStateOverlay(message, DEFAULT_OVERLAY_CONFIG);
  overlayElements = elements;

  // Attach event listeners for dismissal
  attachEventListeners();

  logger.log('[OverlayManager] Empty state overlay displayed successfully');
}

/**
 * Close overlay and trigger cleanup
 */
export function closeOverlay(): void {
  if (!overlayState?.isVisible) {
    logger.log('[OverlayManager] No overlay to close');
    return;
  }

  logger.log('[OverlayManager] Closing overlay');

  // Mark as hidden
  if (overlayState) {
    overlayState.isVisible = false;
  }

  // Remove event listeners
  removeEventListeners();

  // Cleanup DOM
  destroyOverlay();

  // Clear state
  overlayState = null;
  overlayElements = null;

  logger.log('[OverlayManager] Overlay closed and cleaned up');
}

/**
 * Destroy overlay DOM elements
 */
function destroyOverlay(): void {
  if (!overlayElements) {
    return;
  }

  // Remove backdrop (which contains the container)
  if (overlayElements.backdrop.parentNode) {
    overlayElements.backdrop.parentNode.removeChild(overlayElements.backdrop);
  }

  logger.log('[OverlayManager] DOM elements removed');
}

/**
 * Attach event listeners for overlay dismissal
 */
function attachEventListeners(): void {
  if (!overlayElements) {
    return;
  }

  try {
    // ESC key dismissal (capture phase)
    document.addEventListener('keydown', handleEscapeKey, true);

    // Click outside dismissal (on backdrop)
    overlayElements.backdrop.addEventListener('click', handleBackdropClick, true);

    // Close button dismissal (will be attached by renderer)
    const closeButton = overlayElements.container.querySelector('.tweetyoink-overlay-close');
    if (closeButton) {
      closeButton.addEventListener('click', handleCloseButtonClick as EventListener, true);
    } else {
      logger.warn('[OverlayManager] Close button not found - overlay may not be dismissable via button');
    }

    // Navigation cleanup listener
    window.addEventListener('popstate', handleNavigation, true);

    logger.log('[OverlayManager] Event listeners attached');
  } catch (error) {
    logger.error('[OverlayManager] Failed to attach event listeners:', error);
    // Overlay remains functional even if some listeners fail (ESC and backdrop should work)
  }
}

/**
 * Remove event listeners
 */
function removeEventListeners(): void {
  // Remove ESC key listener
  document.removeEventListener('keydown', handleEscapeKey, true);

  // Remove backdrop click listener
  if (overlayElements?.backdrop) {
    overlayElements.backdrop.removeEventListener('click', handleBackdropClick, true);
  }

  // Remove close button listener
  if (overlayElements?.container) {
    const closeButton = overlayElements.container.querySelector('.tweetyoink-overlay-close');
    if (closeButton) {
      closeButton.removeEventListener('click', handleCloseButtonClick as EventListener, true);
    }
  }

  // Remove navigation listener
  window.removeEventListener('popstate', handleNavigation, true);

  logger.log('[OverlayManager] Event listeners removed');
}

/**
 * Handle ESC key press
 */
function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' || event.key === 'Esc') {
    logger.log('[OverlayManager] ESC key pressed - closing overlay');
    event.stopPropagation();
    event.preventDefault();
    closeOverlay();
  }
}

/**
 * Handle click on backdrop (outside overlay container)
 */
function handleBackdropClick(event: MouseEvent): void {
  // Only close if clicking directly on backdrop, not on container
  if (event.target === overlayElements?.backdrop) {
    logger.log('[OverlayManager] Clicked outside overlay - closing');
    event.stopPropagation();
    event.preventDefault();
    closeOverlay();
  }
}

/**
 * Handle close button click
 */
function handleCloseButtonClick(event: MouseEvent): void {
  logger.log('[OverlayManager] Close button clicked');
  event.stopPropagation();
  event.preventDefault();
  closeOverlay();
}

/**
 * Handle page navigation (cleanup overlay)
 */
function handleNavigation(): void {
  logger.log('[OverlayManager] Page navigation detected - closing overlay');
  closeOverlay();
}

/**
 * Check if overlay is currently visible
 */
export function isOverlayVisible(): boolean {
  return overlayState?.isVisible ?? false;
}

/**
 * Get current overlay state (for debugging)
 */
export function getOverlayState(): OverlayState | null {
  return overlayState;
}
