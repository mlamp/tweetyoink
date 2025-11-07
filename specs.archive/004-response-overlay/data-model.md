# Data Model: Server Response Overlay Display

**Feature**: 004-response-overlay
**Date**: 2025-10-29
**Purpose**: Define TypeScript interfaces and data structures

## Overview

This document defines the data structures for displaying server responses in an overlay. The model includes server-provided content items, client-side overlay state, and configuration.

## Core Entities

### 1. ResponseContentItem (Server → Client)

Represents a single piece of content returned by the server for display.

**TypeScript Interface**:
```typescript
/**
 * Individual content item from server response
 * Supports multiple content types, currently rendering only "text"
 */
interface ResponseContentItem {
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
```

**Field Semantics**:
- `type`: Determines how content is rendered
  - `"text"`: Plain text content (rendered via textContent)
  - `"image"`: Image URL (not supported in v1, gracefully skipped)
  - `"link"`: Hyperlink (not supported in v1, gracefully skipped)
  - Other values: Gracefully ignored (FR-008)
- `content`: Always a string, interpretation depends on `type`
- `metadata`: Optional, available for future extensions

**Validation Rules**:
- `type` MUST be present (required field)
- `content` MUST be present (required field)
- `metadata` is optional
- Unknown `type` values are valid but result in item being skipped

**Example Instances**:
```typescript
// Simple text item
{
  type: "text",
  content: "This tweet demonstrates sentiment analysis"
}

// Text with metadata
{
  type: "text",
  content: "Detected sentiment: positive (confidence: 95%)",
  metadata: {
    title: "Sentiment Analysis",
    timestamp: "2025-10-29T12:00:00Z"
  }
}

// Future: Image (not rendered in v1)
{
  type: "image",
  content: "https://example.com/chart.png",
  metadata: { title: "Visualization" }
}
```

### 2. OverlayState (Client-Side)

Manages the current overlay display state.

**TypeScript Interface**:
```typescript
/**
 * Client-side overlay state
 * Singleton instance manages what's currently displayed
 */
interface OverlayState {
  /** Whether overlay is currently visible */
  isVisible: boolean;

  /** Content items being displayed */
  contentItems: ResponseContentItem[];

  /** Tweet ID that triggered this overlay (for context) */
  associatedTweetId: string;

  /** When overlay was created (for debugging) */
  createdAt: number; // timestamp
}
```

**State Transitions**:
```
NULL → { isVisible: true, ... }     // show()
{ isVisible: true } → { isVisible: false }  // close()
{ isVisible: false } → NULL         // destroy()
```

**Lifecycle**:
1. **Created**: When server response with displayable content arrives
2. **Visible**: Overlay rendered in DOM, user can interact
3. **Closed**: User dismisses overlay (ESC, click outside, close button)
4. **Destroyed**: DOM cleaned up, instance set to null

**Example Instance**:
```typescript
{
  isVisible: true,
  contentItems: [
    { type: "text", content: "Analysis result 1" },
    { type: "text", content: "Analysis result 2" }
  ],
  associatedTweetId: "1234567890",
  createdAt: 1698576000000
}
```

### 3. OverlayConfig (Configuration)

Static configuration for overlay behavior.

**TypeScript Interface**:
```typescript
/**
 * Overlay configuration constants
 * Defined at compile time, no runtime modification
 */
interface OverlayConfig {
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
```

**Default Values**:
```typescript
const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  maxItems: 50,           // Per spec, handle up to 50 items
  maxContentLength: 10000, // 10k chars per spec edge case
  animationDurationMs: 200, // Meets SC-001 (<200ms)
  zIndex: 10001,           // Above Twitter's typical z-index range
  backdropOpacity: 0.5     // Semi-transparent backdrop
};
```

**Usage**:
- Read-only constants
- No user configuration in v1
- May become user-configurable in future versions

## Data Flow

### Server → Overlay Display

```
1. User clicks Yoink button
2. content-script.ts sends tweet data to service-worker.ts
3. service-worker.ts POSTs to server
4. Server returns PostResponse with result array

5. [If sync response]
   service-worker.ts → content-script.ts (chrome.tabs.sendMessage)

6. [If async response]
   polling-service.ts polls /status
   When complete → content-script.ts (chrome.tabs.sendMessage)

7. content-script.ts receives response
8. response-handler.ts parses result array
9. response-handler.ts filters for displayable items (type="text")
10. overlay-manager.ts creates overlay with filtered items
11. overlay-renderer.ts renders each item to DOM
12. User sees overlay
```

### Overlay Dismissal

```
1. User action (ESC key, click outside, close button)
2. Event handler in overlay-manager.ts detects action
3. overlay-manager.ts.close() called
4. DOM elements removed
5. Event listeners cleaned up
6. OverlayState set to null
```

## Type Definitions File Structure

**Location**: `src/types/overlay.ts`

```typescript
/**
 * Type definitions for server response overlay display
 * Feature: 004-response-overlay
 */

export interface ResponseContentItem {
  type: 'text' | 'image' | 'link' | string;
  content: string;
  metadata?: {
    title?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface OverlayState {
  isVisible: boolean;
  contentItems: ResponseContentItem[];
  associatedTweetId: string;
  createdAt: number;
}

export interface OverlayConfig {
  maxItems: number;
  maxContentLength: number;
  animationDurationMs: number;
  zIndex: number;
  backdropOpacity: number;
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  maxItems: 50,
  maxContentLength: 10000,
  animationDurationMs: 200,
  zIndex: 10001,
  backdropOpacity: 0.5
};

/**
 * Type guard to check if content item is renderable
 */
export function isRenderableContentItem(item: ResponseContentItem): boolean {
  return item.type === 'text' && typeof item.content === 'string';
}
```

## Relationship Diagram

```
Server Response
    ↓
PostResponse
    ↓
result: ResponseContentItem[]
    ↓
response-handler.ts (filters)
    ↓
Filtered ResponseContentItem[] (only type="text")
    ↓
overlay-manager.ts (creates OverlayState)
    ↓
overlay-renderer.ts (renders to DOM)
    ↓
DOM Elements (visible to user)
```

## Validation & Error Handling

### ResponseContentItem Validation

```typescript
function validateContentItem(item: unknown): item is ResponseContentItem {
  if (typeof item !== 'object' || item === null) return false;

  const obj = item as Record<string, unknown>;

  // Required fields
  if (typeof obj.type !== 'string') return false;
  if (typeof obj.content !== 'string') return false;

  // Optional metadata
  if (obj.metadata !== undefined) {
    if (typeof obj.metadata !== 'object' || obj.metadata === null) {
      return false;
    }
  }

  return true;
}
```

### Edge Case Handling

| Scenario | Behavior |
|----------|----------|
| Empty result array | Show "No results available" message |
| All items non-text type | Show "No displayable content" message |
| Single text item | Display normally (no special case) |
| 50+ items | Render all (spec allows up to 50, scroll if needed) |
| Content > 10k chars | Display fully (future: truncation warning) |
| Malformed content item | Skip item, log warning, continue rendering others |
| Metadata missing | Ignore, render content without metadata |

## Future Extensions

**Potential additions** (not in current scope):

1. **Image Support**:
   ```typescript
   type: "image" → <img src={content} />
   ```

2. **Link Support**:
   ```typescript
   type: "link" → <a href={content}>View</a>
   ```

3. **Rich Metadata Display**:
   ```typescript
   metadata.title → Overlay header per item
   metadata.timestamp → Relative time display
   ```

4. **User Preferences**:
   ```typescript
   interface OverlayPreferences {
     theme: 'light' | 'dark' | 'auto';
     position: 'center' | 'right' | 'bottom';
     maxItemsToShow: number;
   }
   ```

## Testing Considerations

**Unit Test Targets**:
- `validateContentItem()`: Test all validation paths
- `isRenderableContentItem()`: Test type filtering
- OverlayState transitions: Test lifecycle

**Integration Test Scenarios**:
- Server returns 1 item → Overlay shows 1 item
- Server returns 20 items → Overlay shows all 20
- Server returns mixed types → Only text items shown
- Server returns empty array → "No results" message
- User dismisses overlay → DOM cleaned up

**Type Safety Tests**:
- TypeScript compilation with strict mode
- No `any` types in overlay codebase
- All interfaces properly exported/imported
