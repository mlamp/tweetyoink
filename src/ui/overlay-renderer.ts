import { logger } from '../utils/logger';

/**
 * Overlay Renderer
 * Feature: 004-response-overlay
 *
 * Handles DOM creation and rendering for overlay display
 */

import type { ResponseContentItem, OverlayConfig } from '../types/overlay';

/**
 * Escape HTML characters to prevent XSS injection
 * @param text - Raw text that may contain HTML characters
 * @returns Escaped text safe for innerHTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render overlay to DOM and return element references
 *
 * @param contentItems - Array of content items to render
 * @param config - Overlay configuration
 * @returns DOM element references for backdrop and container
 */
export function renderOverlay(
  contentItems: ResponseContentItem[],
  config: OverlayConfig
): { backdrop: HTMLElement; container: HTMLElement } {
  logger.log('[OverlayRenderer] Rendering overlay with', contentItems.length, 'items');

  // Create backdrop element
  const backdrop = createBackdrop(config);

  // Create container element
  const container = createContainer(config);

  // Create header with close button
  const header = createHeader();
  container.appendChild(header);

  // Create content area
  const contentArea = createContentArea();

  // Render content items
  contentItems.forEach((item) => {
    const itemElement = renderContentItem(item);
    contentArea.appendChild(itemElement);
  });

  container.appendChild(contentArea);

  // Append container to backdrop
  backdrop.appendChild(container);

  // Append backdrop to document body
  document.body.appendChild(backdrop);

  logger.log('[OverlayRenderer] Overlay rendered to DOM');

  return { backdrop, container };
}

/**
 * Render overlay with empty state message
 *
 * @param message - Empty state message to display
 * @param config - Overlay configuration
 * @returns DOM element references for backdrop and container
 */
export function renderEmptyStateOverlay(
  message: string,
  config: OverlayConfig
): { backdrop: HTMLElement; container: HTMLElement } {
  logger.log('[OverlayRenderer] Rendering empty state overlay with message:', message);

  // Create backdrop element
  const backdrop = createBackdrop(config);

  // Create container element
  const container = createContainer(config);

  // Create header with close button
  const header = createHeader();
  container.appendChild(header);

  // Create content area
  const contentArea = createContentArea();

  // Create empty state message element
  const messageElement = createEmptyStateMessage(message);
  contentArea.appendChild(messageElement);

  container.appendChild(contentArea);

  // Append container to backdrop
  backdrop.appendChild(container);

  // Append backdrop to document body
  document.body.appendChild(backdrop);

  logger.log('[OverlayRenderer] Empty state overlay rendered to DOM');

  return { backdrop, container };
}

/**
 * Create backdrop element (semi-transparent overlay background)
 */
function createBackdrop(config: OverlayConfig): HTMLElement {
  const backdrop = document.createElement('div');
  backdrop.className = 'tweetyoink-overlay-backdrop';

  // Apply backdrop opacity from config (CSS default is 0.5)
  if (config.backdropOpacity !== 0.5) {
    backdrop.style.setProperty('--backdrop-opacity', config.backdropOpacity.toString());
  }

  return backdrop;
}

/**
 * Create container element (main overlay box)
 */
function createContainer(config: OverlayConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tweetyoink-overlay-container';

  // Apply z-index from config (CSS default is 10002)
  if (config.zIndex !== 10001) {
    // Container is zIndex + 1
    container.style.zIndex = (config.zIndex + 1).toString();
  }

  return container;
}

/**
 * Create header with title and close button
 */
function createHeader(): HTMLElement {
  const header = document.createElement('div');
  header.className = 'tweetyoink-overlay-header';

  // Title
  const title = document.createElement('h2');
  title.className = 'tweetyoink-overlay-title';
  title.textContent = 'Server Response';
  header.appendChild(title);

  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'tweetyoink-overlay-close';
  closeButton.setAttribute('aria-label', 'Close overlay');
  closeButton.setAttribute('type', 'button');
  closeButton.textContent = '×';
  header.appendChild(closeButton);

  return header;
}

/**
 * Create content area (scrollable container for items)
 */
function createContentArea(): HTMLElement {
  const contentArea = document.createElement('div');
  contentArea.className = 'tweetyoink-overlay-content';
  return contentArea;
}

/**
 * Create empty state message element
 *
 * @param message - Message text to display
 * @returns DOM element for empty state message
 */
function createEmptyStateMessage(message: string): HTMLElement {
  const messageElement = document.createElement('div');
  messageElement.className = 'tweetyoink-overlay-empty-state';
  // Escape HTML and preserve newlines (same as content items for consistency)
  const escapedText = escapeHtml(message);
  const formattedText = escapedText.replace(/\n/g, '<br>');
  messageElement.innerHTML = formattedText;
  return messageElement;
}

/**
 * Render a single content item
 *
 * @param item - Content item to render
 * @returns DOM element for the item
 */
function renderContentItem(item: ResponseContentItem): HTMLElement {
  const itemElement = document.createElement('div');
  itemElement.className = 'tweetyoink-overlay-item';

  // Render based on content type
  if (item.type === 'image') {
    // Create image element
    const img = document.createElement('img');
    img.src = item.content;
    img.className = 'tweetyoink-overlay-image';

    // Add alt text from metadata if available
    if (item.metadata?.altText) {
      img.alt = String(item.metadata.altText);
    } else if (item.metadata?.title) {
      img.alt = String(item.metadata.title);
    } else {
      img.alt = 'Tweet image';
    }

    // Add loading and error handlers
    img.loading = 'lazy';
    img.onerror = () => {
      img.style.display = 'none';
      const errorText = document.createElement('div');
      // Don't expose image URL in error message (security/privacy)
      errorText.textContent = 'Failed to load image';
      errorText.className = 'tweetyoink-overlay-error';
      itemElement.appendChild(errorText);
    };

    itemElement.appendChild(img);
  } else {
    // Text content - escape HTML and convert newlines to <br> for formatting
    // This is XSS-safe because we escape all HTML first, then only add <br> tags
    const escapedText = escapeHtml(item.content);
    const formattedText = escapedText.replace(/\n/g, '<br>');
    itemElement.innerHTML = formattedText;
  }

  // Add data attributes for debugging
  itemElement.setAttribute('data-type', item.type);

  if (item.metadata) {
    // Store metadata as data attribute (for future use)
    try {
      itemElement.setAttribute('data-metadata', JSON.stringify(item.metadata));
    } catch (error) {
      logger.warn('[OverlayRenderer] Failed to serialize metadata:', error);
    }
  }

  return itemElement;
}

/**
 * Load overlay CSS if not already loaded
 *
 * NOTE: This is a stub function for future CSS injection capability.
 * Currently, overlay styles are injected via manifest.json content_scripts configuration,
 * which is the recommended approach for Chrome extensions.
 *
 * This function serves as:
 * 1. A detection mechanism to verify CSS is loaded
 * 2. A hook point for future runtime CSS injection if needed
 * 3. Documentation of the CSS loading strategy
 *
 * Future enhancement: If runtime injection is needed (e.g., for dynamic themes),
 * this function can fetch and inject CSS using chrome.runtime.getURL() and document.createElement('style')
 */
export function loadOverlayStyles(): void {
  // Check if styles are already loaded (via link tag or inline style tag)
  if (document.querySelector('link[href*="overlay.css"]') || document.querySelector('style[data-overlay-styles]')) {
    logger.log('[OverlayRenderer] Overlay styles already loaded');
    return;
  }

  // In a Chrome extension, CSS files are typically injected via manifest.json content_scripts
  // This is the current implementation approach (see manifest.json)
  logger.log('[OverlayRenderer] Overlay styles should be loaded via manifest.json');

  // For now, we rely on CSS being injected by the extension build process
  // If styles are missing at runtime, the overlay will still render but may lack styling
}
