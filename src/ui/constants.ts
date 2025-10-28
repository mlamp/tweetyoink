/**
 * UI constants for TweetYoink extension
 * Feature: 002-post-view-yoink
 */

/**
 * Duration to display error state on button before resetting (milliseconds)
 * Shows the red error color for 2 seconds before returning to default state
 */
export const ERROR_DISPLAY_DURATION_MS = 2000;

/**
 * Throttle delay for MutationObserver callback (milliseconds)
 * 200ms was chosen to balance responsiveness (quickly reacting to DOM changes)
 * with performance (avoiding excessive processing and UI jank).
 * This value is supported by findings referenced in research.md.
 */
export const MUTATION_OBSERVER_THROTTLE_MS = 200;

/**
 * X/Twitter color scheme constants (from research.md)
 */
export const COLORS = {
  DEFAULT_GRAY: 'rgb(113, 118, 123)',
  HOVER_BLUE: 'rgb(29, 155, 240)',
  HOVER_BG: 'rgba(29, 155, 240, 0.1)',
  ERROR_RED: 'rgb(249, 24, 128)',
};
