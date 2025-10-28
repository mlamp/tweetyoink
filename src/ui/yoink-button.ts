/**
 * Yoink button component creation and event handling
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/research.md
 */

import { createYoinkIconElement } from './icons';

/**
 * X/Twitter color scheme constants (from research.md)
 */
const COLORS = {
  DEFAULT_GRAY: 'rgb(113, 118, 123)',
  HOVER_BLUE: 'rgb(29, 155, 240)',
  HOVER_BG: 'rgba(29, 155, 240, 0.1)',
};

/**
 * Creates a Yoink button element matching X/Twitter's action button styling
 * @returns HTMLButtonElement configured with icon, styles, and tooltip
 */
export function createYoinkButton(): HTMLButtonElement {
  const button = document.createElement('button');

  // Accessibility attributes
  button.setAttribute('aria-label', 'Yoink this tweet');
  button.setAttribute('type', 'button');
  button.setAttribute('role', 'button');

  // Add custom data attribute for tracking
  button.setAttribute('data-yoink-button', 'true');

  // Styling to match X/Twitter action buttons
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34.75px;
    height: 34.75px;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: ${COLORS.DEFAULT_GRAY};
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  `;

  // Insert icon
  const icon = createYoinkIconElement();
  button.appendChild(icon);

  // Hover state
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = COLORS.HOVER_BG;
    button.style.color = COLORS.HOVER_BLUE;
  });

  button.addEventListener('mouseleave', () => {
    if (!button.disabled) {
      button.style.backgroundColor = 'transparent';
      button.style.color = COLORS.DEFAULT_GRAY;
    }
  });

  // Focus state (keyboard navigation)
  button.addEventListener('focus', () => {
    button.style.outline = `2px solid ${COLORS.HOVER_BLUE}`;
    button.style.outlineOffset = '2px';
  });

  button.addEventListener('blur', () => {
    button.style.outline = 'none';
  });

  return button;
}

/**
 * Sets the button to disabled state during extraction
 * @param button - The Yoink button element
 */
export function disableButton(button: HTMLButtonElement): void {
  button.disabled = true;
  button.style.opacity = '0.5';
  button.style.cursor = 'not-allowed';
  button.setAttribute('aria-disabled', 'true');
}

/**
 * Re-enables the button after extraction completes
 * @param button - The Yoink button element
 */
export function enableButton(button: HTMLButtonElement): void {
  button.disabled = false;
  button.style.opacity = '1';
  button.style.cursor = 'pointer';
  button.style.backgroundColor = 'transparent';
  button.style.color = COLORS.DEFAULT_GRAY;
  button.removeAttribute('aria-disabled');
}

/**
 * Shows error state on button (red color)
 * @param button - The Yoink button element
 */
export function showButtonError(button: HTMLButtonElement): void {
  button.style.color = 'rgb(249, 24, 128)'; // X/Twitter error red
  setTimeout(() => {
    button.style.color = COLORS.DEFAULT_GRAY;
  }, 2000); // Reset after 2 seconds
}
