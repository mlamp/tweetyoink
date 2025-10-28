/**
 * SVG icon definitions for Yoink button
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/research.md
 *
 * Icon Design: "Capture frame" metaphor with corner brackets and center dot
 * Size: 20x20px (matches X/Twitter action buttons)
 * Color: currentColor (inherits from parent for hover states)
 */

/**
 * Yoink button icon SVG
 * Represents a capture frame with corner brackets and center focus dot
 */
export const yoinkIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
  <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
  <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
  <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
  <circle cx="12" cy="12" r="2"/>
</svg>
`.trim();

/**
 * Creates the Yoink icon element as HTMLElement for injection
 * @returns SVG element with proper dimensions and styling
 */
export function createYoinkIconElement(): SVGSVGElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(yoinkIcon, 'image/svg+xml');
  const svgElement = doc.documentElement as unknown as SVGSVGElement;

  // Set dimensions to match X/Twitter action button icons
  svgElement.setAttribute('width', '20');
  svgElement.setAttribute('height', '20');
  svgElement.style.display = 'block';

  return svgElement;
}
