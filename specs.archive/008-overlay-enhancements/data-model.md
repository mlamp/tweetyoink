# Data Model: Overlay Title Support and Debug JSON Type

**Feature**: 008-overlay-enhancements
**Date**: 2025-11-01
**Status**: Complete

## Overview

This document defines the enhanced data structures for overlay content items with title support and the new debug JSON content type. These are extensions to the existing ResponseContentItem interface from Feature 004.

## Core Entities

### ResponseContentItem (Enhanced)

**Purpose**: Individual piece of content returned by server for overlay display

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | `'text' \| 'image' \| 'debug' \| 'link' \| string` | Yes | Content type identifier. NEW: "debug" type added |
| content | `string \| object` | Yes | Content payload. Type depends on 'type' field: text/image/link use string, debug uses object |
| title | `string` | No | **NEW**: Optional title displayed above content. Applies to all content types |
| metadata | `object` | No | Optional metadata (existing, unchanged) |

**Validation Rules**:
- `type` must be non-empty string
- `content` must match type:
  - If `type === 'debug'`, content must be object (JSON-serializable)
  - Otherwise, content must be string
- `title` if present must be non-empty after trimming whitespace
- `metadata` if present must be valid JSON object

**Example (Text with Title)**:
```typescript
{
  type: 'text',
  content: 'This tweet demonstrates positive sentiment (95% confidence)',
  title: 'Sentiment Analysis',
  metadata: {
    confidence: 0.95,
    timestamp: '2025-11-01T12:00:00Z'
  }
}
```

**Example (Debug JSON with Title)**:
```typescript
{
  type: 'debug',
  title: 'Request Metadata',
  content: {
    author: '@elonmusk',
    url: 'https://x.com/elonmusk/status/123',
    has_media: true,
    media_count: 2,
    text_length: 280,
    tweet_type: 'quote'
  }
}
```

**State Transitions**: N/A (read-only display data)

---

### DebugContentItem (New)

**Purpose**: Specialized interface for debug JSON content type

**Extends**: ResponseContentItem

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | `'debug'` | Yes | Always "debug" for this content type |
| content | `object \| unknown[]` | Yes | JSON-serializable object or array to display |
| title | `string` | No | Optional title for the debug block |
| metadata | `object` | No | Optional metadata |

**Validation Rules**:
- `content` must be JSON-serializable (no functions, symbols, circular refs)
- `content` should be object or array (primitives handled gracefully but not ideal)
- If JSON.stringify() fails, error message displayed instead

**Example (Nested Debug Data)**:
```typescript
{
  type: 'debug',
  title: 'Processing Pipeline',
  content: {
    stages: [
      { name: 'sentiment', status: 'completed', duration_ms: 145 },
      { name: 'entity_extraction', status: 'completed', duration_ms: 203 },
      { name: 'topic_modeling', status: 'completed', duration_ms: 478 }
    ],
    total_duration_ms: 826,
    success: true,
    errors: []
  }
}
```

**Type Guards**:
```typescript
function isDebugContentItem(item: ResponseContentItem): item is DebugContentItem {
  return item.type === 'debug' && typeof item.content === 'object';
}
```

---

### TitleRenderOptions (New)

**Purpose**: Configuration for title rendering behavior

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| maxLength | `number` | No | Maximum title length before truncation (default: 500) |
| showEmpty | `boolean` | No | Whether to render empty/whitespace-only titles (default: false) |
| sanitize | `boolean` | No | Whether to sanitize HTML/special chars (default: true) |

**Default Configuration**:
```typescript
const DEFAULT_TITLE_OPTIONS: TitleRenderOptions = {
  maxLength: 500,
  showEmpty: false,
  sanitize: true
};
```

---

### DebugRenderOptions (New)

**Purpose**: Configuration for debug JSON formatting

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| indent | `number` | No | Number of spaces for JSON indentation (default: 2) |
| maxDepth | `number` | No | Maximum nesting depth before truncation (default: 20) |
| maxSizeKB | `number` | No | Maximum JSON size before warning (default: 50) |
| showErrors | `boolean` | No | Whether to show formatting errors inline (default: true) |

**Default Configuration**:
```typescript
const DEFAULT_DEBUG_OPTIONS: DebugRenderOptions = {
  indent: 2,
  maxDepth: 20,
  maxSizeKB: 50,
  showErrors: true
};
```

---

## Relationships

```text
ResponseContentItem (base interface)
  ├─> title: string (optional, NEW)
  ├─> content: string | object (union type, enhanced)
  └─> metadata: object (optional, existing)

DebugContentItem (specialized interface)
  extends ResponseContentItem
  ├─> type: 'debug' (literal type)
  ├─> content: object | unknown[] (narrowed type)
  └─> title: string (optional, inherited)

OverlayState (existing, unchanged)
  ├─> contentItems: ResponseContentItem[] (includes enhanced items)
  ├─> isVisible: boolean
  ├─> associatedTweetId: string
  └─> createdAt: number
```

## TypeScript Interfaces

### Complete Enhanced Interfaces

```typescript
/**
 * Enhanced ResponseContentItem with title support (Feature 008)
 */
export interface ResponseContentItem {
  /** Content type identifier */
  type: 'text' | 'image' | 'debug' | 'link' | string;

  /** Content payload - string for text/image/link, object for debug */
  content: string | object;

  /** Optional title displayed above content (NEW in Feature 008) */
  title?: string;

  /** Optional metadata */
  metadata?: {
    title?: string; // Deprecated in favor of top-level title field
    timestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * Debug content item for formatted JSON display (Feature 008)
 */
export interface DebugContentItem extends ResponseContentItem {
  type: 'debug';
  content: object | unknown[]; // JSON-serializable data
  title?: string;
}

/**
 * Options for title rendering
 */
export interface TitleRenderOptions {
  maxLength?: number;
  showEmpty?: boolean;
  sanitize?: boolean;
}

/**
 * Options for debug JSON formatting
 */
export interface DebugRenderOptions {
  indent?: number;
  maxDepth?: number;
  maxSizeKB?: number;
  showErrors?: boolean;
}
```

### Type Guards

```typescript
/**
 * Type guard for debug content items
 */
export function isDebugContentItem(
  item: ResponseContentItem
): item is DebugContentItem {
  return item.type === 'debug' && typeof item.content === 'object';
}

/**
 * Check if title should be rendered
 */
export function hasRenderableTitle(item: ResponseContentItem): boolean {
  return typeof item.title === 'string' && item.title.trim().length > 0;
}

/**
 * Validate content type matches content structure
 */
export function isValidContentItem(item: ResponseContentItem): boolean {
  if (item.type === 'debug') {
    return typeof item.content === 'object';
  }
  // For text, image, link types, content should be string
  return typeof item.content === 'string';
}
```

## Validation Logic

### Title Validation

```typescript
function validateTitle(title: string | undefined): string | null {
  if (!title) return null;

  const trimmed = title.trim();
  if (trimmed.length === 0) return null;

  // Truncate very long titles
  if (trimmed.length > 500) {
    return trimmed.substring(0, 500) + '...';
  }

  return trimmed;
}
```

### Debug Content Validation

```typescript
function validateDebugContent(content: unknown): object | null {
  if (typeof content !== 'object' || content === null) {
    logger.warn('[Overlay] Debug content must be object, got:', typeof content);
    return null;
  }

  // Test JSON serializability
  try {
    JSON.stringify(content);
    return content as object;
  } catch (error) {
    logger.warn('[Overlay] Debug content not JSON-serializable:', error);
    return null;
  }
}
```

## Migration Notes

### Backward Compatibility

**Existing v1.1.0 responses remain valid**:
- ResponseContentItem without `title` field → renders normally (no title header)
- All existing `type` values ('text', 'image', 'link') → unchanged behavior
- metadata.title (Feature 005 pattern) → still works but deprecated in favor of top-level title

**Gradual Adoption Path**:
1. Servers can continue sending v1.1.0 format indefinitely
2. Add `title` field to existing items (backward compatible addition)
3. Add new `debug` type items alongside existing types
4. No breaking changes, no forced migration

### Deprecation Notice

**metadata.title field**: While still supported for backward compatibility, new implementations should use the top-level `title` field instead. The metadata.title pattern from Feature 005 will be removed in a future major version.

## Examples

### Complete Response Examples

**Example 1: Mixed Content with Titles**
```typescript
{
  status: 'completed',
  result: [
    {
      type: 'text',
      title: 'Sentiment Analysis',
      content: 'Positive sentiment detected (confidence: 95%)'
    },
    {
      type: 'text',
      title: 'Key Topics',
      content: 'AI, machine learning, technology, innovation'
    },
    {
      type: 'debug',
      title: 'Processing Metrics',
      content: {
        total_time_ms: 826,
        model: 'gpt-4',
        tokens_used: 1234,
        stages: ['sentiment', 'topics', 'entities']
      }
    }
  ]
}
```

**Example 2: Backward Compatible (No Titles)**
```typescript
{
  status: 'completed',
  result: [
    {
      type: 'text',
      content: 'Analysis complete: Positive sentiment'
    },
    {
      type: 'text',
      content: 'Detected topics: technology, AI'
    }
  ]
}
```

**Example 3: Debug-Only Response**
```typescript
{
  status: 'completed',
  result: [
    {
      type: 'debug',
      title: 'Full Analysis Results',
      content: {
        sentiment: { score: 0.95, label: 'positive' },
        entities: [
          { text: 'AI', type: 'technology', confidence: 0.98 },
          { text: 'innovation', type: 'concept', confidence: 0.87 }
        ],
        topics: ['technology', 'ai', 'future'],
        metadata: {
          processing_time: '826ms',
          model: 'gpt-4',
          version: '2025-11-01'
        }
      }
    }
  ]
}
```

---

**Related Documentation**:
- [spec.md](./spec.md) - Feature specification
- [research.md](./research.md) - Technical research findings
- [Feature 004 Data Model](../004-response-overlay/data-model.md) - Base ResponseContentItem definition
