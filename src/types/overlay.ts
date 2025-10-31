/**
 * Type definitions for server response overlay display
 * Feature: 004-response-overlay
 */

export interface ResponseContentItem {
  /** Content type identifier */
  type: 'text' | 'image' | 'link' | string;

  /** Content payload to display */
  content: string;

  /** Optional metadata (title, timestamp, etc.) */
  metadata?: {
    title?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface OverlayState {
  /** Whether overlay is currently visible */
  isVisible: boolean;

  /** Content items being displayed */
  contentItems: ResponseContentItem[];

  /** Tweet ID that triggered this overlay (for context) */
  associatedTweetId: string;

  /** When overlay was created (for debugging) */
  createdAt: number; // timestamp
}

export interface OverlayConfig {
  /** Maximum number of items to render (performance limit) */
  maxItems: number;

  /** Maximum content length before truncation warning */
  maxContentLength: number;

  /** Show/hide animation duration in milliseconds */
  animationDurationMs: number;

  /** Z-index to ensure overlay appears above Twitter UI */
  zIndex: number;

  /** Backdrop opacity (0-1) */
  backdropOpacity: number;
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  maxItems: 50,
  maxContentLength: 10000,
  animationDurationMs: 200,
  zIndex: 10001,
  backdropOpacity: 0.5,
};

/**
 * Type guard to check if content item is renderable
 */
export function isRenderableContentItem(item: ResponseContentItem): boolean {
  return item.type === 'text' && typeof item.content === 'string';
}
