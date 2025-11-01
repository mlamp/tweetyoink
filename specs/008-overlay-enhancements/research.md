# Research: Overlay Title Support and Debug JSON Type

**Feature**: 008-overlay-enhancements
**Date**: 2025-11-01
**Status**: Complete

## Overview

This document captures research findings for enhancing the overlay response system with optional titles and a new debug JSON content type. The feature extends existing Feature 004 (Server Response Overlay Display) with minimal changes.

## 1. JSON Formatting Approach

### Decision

**Native JSON.stringify() with 2-space indentation**

### Rationale

1. **Zero Dependencies**: Uses browser-native JSON.stringify() which is universally available and battle-tested.

2. **Perfect TypeScript Integration**: JSON.stringify() already accepts typed objects and handles all JSON-serializable types correctly (objects, arrays, strings, numbers, booleans, null).

3. **Performance**: Native C++ implementation in browsers is faster than any JavaScript library. Can handle 1000+ line JSON without performance issues.

4. **Consistency**: Built-in formatting with space parameter provides exactly the 2-space indentation requested:
   ```typescript
   JSON.stringify(data, null, 2) // 2-space indent
   ```

5. **XSS Safety**: When rendered via `textContent` (existing pattern in overlay-renderer.ts), JSON output is automatically XSS-safe. No additional sanitization required.

### Alternatives Considered

- **highlight.js** (96K weekly downloads): Provides syntax highlighting with colors, but adds 50KB+ dependency for minimal UX improvement. **Rejected** - overkill for monospaced JSON display.

- **json-formatter-js** (170K weekly downloads): Interactive JSON viewer with expand/collapse. **Rejected** - too complex, users just need readable formatted JSON, not interactive features.

- **prettier**: Runtime formatting library. **Rejected** - 5MB+ package size, designed for build-time formatting not runtime display.

- **Custom recursive formatter**: Writing our own JSON formatter. **Rejected** - reinventing the wheel, JSON.stringify() handles all edge cases (circular refs, non-serializable, depth limits).

### Implementation Notes

**JSON Serialization**:
```typescript
function formatDebugJson(content: unknown): string {
  try {
    return JSON.stringify(content, null, 2);
  } catch (error) {
    logger.warn('[Overlay] JSON serialization failed:', error);
    return 'Error: Could not format debug content (invalid JSON structure)';
  }
}
```

**Circular Reference Handling**: JSON.stringify() throws TypeError on circular refs. Catch and display error message instead of crashing overlay.

**Non-Serializable Values**: Functions, symbols, undefined values handled by JSON.stringify() (omitted from output or converted to null). This is expected behavior.

**Performance**: JSON.stringify() is O(n) where n is object size. For 50KB JSON (~1000 lines), formatting takes <5ms on modern browsers.

## 2. Title Display Strategy

### Decision

**Optional title field directly on ResponseContentItem interface**

### Rationale

1. **Simplicity**: Cleanest API - title is right where it belongs, on the content item itself:
   ```typescript
   interface ResponseContentItem {
     type: string;
     content: string | object;
     title?: string; // NEW: optional title
     metadata?: object;
   }
   ```

2. **Backward Compatibility**: Optional field means existing responses without title continue to work unchanged. No migration needed.

3. **Consistent with Existing Patterns**: Feature 005 already uses metadata.title for debug content. This approach elevates title to first-class field for all content types, making API more intuitive.

4. **Type Safety**: TypeScript ensures title is always string if present. Runtime checks validate and sanitize.

### Alternatives Considered

- **Title in metadata.title only**: Keep title nested in metadata object. **Rejected** - inconsistent (text items would use metadata.title, but debug items already do). Moving to top-level makes API clearer.

- **Separate TitledContentItem interface**: Create TitledContentItem extends ResponseContentItem. **Rejected** - unnecessary complexity, optional field is simpler and more flexible.

- **Container object wrapping content**: `{ title: string, item: ResponseContentItem }`. **Rejected** - breaks existing structure, requires migration path.

### Implementation Notes

**Title Rendering**:
```typescript
function renderTitle(title: string): HTMLElement {
  const titleEl = document.createElement('div');
  titleEl.className = 'overlay-item-title';
  titleEl.textContent = title; // XSS-safe via textContent
  return titleEl;
}
```

**Title Validation**:
- Empty strings treated as missing (no title header rendered)
- Whitespace-only titles trimmed, then treated as empty
- Very long titles (>500 chars) gracefully handled with CSS text wrapping
- Special characters (newlines, HTML tags) sanitized via textContent

**CSS Strategy**:
- `.overlay-item-title`: Bold font, slightly larger (1.1em), distinct color
- Margin below title for visual separation from content
- Responsive: full width on mobile, wraps as needed

## 3. Type System Design

### Decision

**Extend existing ResponseContentItem with union type for content field**

### Rationale

1. **TypeScript Union Types**: Content field can be `string | object` depending on type:
   ```typescript
   interface ResponseContentItem {
     type: 'text' | 'image' | 'debug' | string;
     content: string | object; // string for text/image, object for debug
     title?: string;
     metadata?: object;
   }
   ```

2. **Type Guards for Safety**: Use TypeScript type guards to narrow types:
   ```typescript
   function isDebugContentItem(item: ResponseContentItem): item is DebugContentItem {
     return item.type === 'debug' && typeof item.content === 'object';
   }
   ```

3. **Explicit DebugContentItem Interface**: Create specialized interface for debug type:
   ```typescript
   interface DebugContentItem extends ResponseContentItem {
     type: 'debug';
     content: object | unknown[]; // JSON-serializable object or array
     title?: string;
   }
   ```

4. **Backward Compatibility**: Existing text/image items remain unchanged. Debug is additive new type.

### Implementation Notes

**Type Guard Pattern**:
```typescript
function renderContentItem(item: ResponseContentItem): HTMLElement {
  const container = document.createElement('div');

  // Render title if present
  if (item.title?.trim()) {
    container.appendChild(renderTitle(item.title));
  }

  // Render content based on type
  if (isDebugContentItem(item)) {
    container.appendChild(renderDebugContent(item.content));
  } else if (item.type === 'text') {
    container.appendChild(renderTextContent(item.content as string));
  } else if (item.type === 'image') {
    container.appendChild(renderImageContent(item.content as string));
  }

  return container;
}
```

**Validation Strategy**:
- Check `typeof item.content === 'object'` for debug type at runtime
- Gracefully handle primitives passed as debug content (convert to object or error)
- Type system prevents most errors at compile time

## 4. CSS and Styling Approach

### Decision

**Monospaced font stack with responsive wrapping**

### Rationale

1. **Monospaced Font Stack**: Use standard monospace fonts available on all platforms:
   ```css
   .overlay-debug-content {
     font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
     white-space: pre-wrap; /* Preserve formatting, allow wrapping */
     word-wrap: break-word; /* Break long lines */
     overflow-x: auto; /* Horizontal scroll only if needed */
   }
   ```

2. **white-space: pre-wrap**: Preserves JSON indentation while allowing text to wrap on narrow viewports. Best of both worlds.

3. **Responsive Strategy**:
   - Desktop (≥768px): No horizontal scroll, content wraps gracefully
   - Mobile (<768px): Allow horizontal scroll if line exceeds viewport
   - Use `max-width: 100%` to prevent overflow

4. **Visual Distinction**: Debug content gets light background color to distinguish from regular text:
   ```css
   .overlay-debug-content {
     background-color: #f5f5f5; /* Light gray */
     padding: 12px;
     border-radius: 4px;
     border-left: 3px solid #666; /* Accent border */
   }
   ```

### Implementation Notes

**Title Styling**:
```css
.overlay-item-title {
  font-weight: bold;
  font-size: 1.1em;
  color: #333;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ddd; /* Subtle separator */
}
```

**Debug Content Styling**:
```css
.overlay-debug-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em; /* Slightly smaller for readability */
  background-color: #f5f5f5;
  color: #333;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #666;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  max-width: 100%;
}
```

**Mobile Responsiveness**:
```css
@media (max-width: 767px) {
  .overlay-debug-content {
    font-size: 0.85em; /* Smaller on mobile */
    padding: 8px; /* Less padding */
  }

  .overlay-item-title {
    font-size: 1em; /* Slightly smaller title */
  }
}
```

## 5. API Contract Updates

### Decision

**Extend existing response-format.yaml to v1.2.0 with additive changes only**

### Rationale

1. **Semantic Versioning**: Minor version bump (1.1.0 → 1.2.0) because changes are backward compatible additions, not breaking changes.

2. **Additive Schema Changes**:
   - Add optional `title` field to ResponseContentItem schema
   - Add "debug" to type enum
   - Add content union type (string | object)
   - Update examples to show new capabilities

3. **Backward Compatibility Guarantee**: All existing v1.1.0 responses remain valid v1.2.0 responses. Servers can adopt new features incrementally.

4. **Clear Migration Path**: Document in contract that servers can:
   - Continue sending v1.1.0 format (no changes required)
   - Add title field to existing items (gradual enhancement)
   - Add debug items alongside existing text items (incremental adoption)

### Implementation Notes

**Updated ResponseContentItem Schema**:
```yaml
ResponseContentItem:
  type: object
  required:
    - type
    - content
  properties:
    type:
      type: string
      enum: [text, image, debug, link, unknown]
      description: |
        Content type identifier (NEW: debug type for JSON objects)
    content:
      oneOf:
        - type: string  # For text, image, link types
        - type: object  # For debug type (JSON object)
      description: |
        Content payload. Type depends on 'type' field:
        - text/image/link: string
        - debug: JSON object (formatted with 2-space indent)
    title:
      type: string
      description: |
        Optional title displayed above content (NEW in v1.2.0).
        Applies to all content types.
    metadata:
      type: object
      description: Optional metadata (existing)
```

**Example Debug Content**:
```yaml
example:
  type: debug
  title: "Request Metadata"
  content:
    author: "@elonmusk"
    url: "https://x.com/elonmusk/status/123"
    has_media: true
    media_count: 2
    text_length: 280
```

## 6. Error Handling Strategy

### Decision

**Graceful degradation with user-friendly error messages**

### Rationale

1. **JSON Serialization Errors**: Catch and display helpful message instead of crashing:
   ```typescript
   try {
     formattedJson = JSON.stringify(content, null, 2);
   } catch (error) {
     logger.warn('[Overlay] JSON formatting failed:', error);
     return 'Error: Invalid JSON structure (circular reference or non-serializable content)';
   }
   ```

2. **Invalid Title Handling**: Sanitize and validate:
   - Empty/whitespace-only → no title rendered
   - HTML tags → stripped via textContent
   - Very long → wrapped gracefully with CSS

3. **Type Mismatches**: Debug content that's not an object:
   ```typescript
   if (item.type === 'debug' && typeof item.content !== 'object') {
     logger.warn('[Overlay] Debug content must be object, got:', typeof item.content);
     // Attempt to convert or show error message
     return renderErrorMessage('Debug content must be a JSON object');
   }
   ```

4. **Logging Strategy**: Use logger.warn() for recoverable errors (per constitution principle VI). User sees helpful message, developer gets console warning in development.

### Edge Cases Handled

1. **Circular References**: JSON.stringify() throws TypeError → catch and show error message
2. **Undefined/Functions in JSON**: JSON.stringify() omits them → expected behavior, no error
3. **Very Deep Nesting (50+ levels)**: May cause stack overflow → catch and show error
4. **Extremely Large JSON (>50KB)**: Performance degradation → warn user if detected
5. **Empty Title String**: Treat as missing, don't render title element
6. **Title with Newlines/HTML**: Sanitized via textContent, displays as plain text

## 7. Performance Considerations

### Decision

**Lazy rendering with performance budgets**

### Rationale

1. **JSON Formatting Budget**: JSON.stringify() for 50KB takes ~5-10ms. Set warning threshold at 50KB.

2. **Title Rendering Budget**: Creating title DOM element takes <1ms. No optimization needed.

3. **Scrolling Performance**: Use `will-change: transform` on overlay container for hardware acceleration. Target 60fps for smooth scrolling even with 1000+ lines.

4. **Memory**: Each content item creates ~5-10 DOM nodes (title + content). 50 items = 250-500 nodes, well within browser limits.

### Implementation Notes

**Performance Monitoring**:
```typescript
if (import.meta.env.DEV) {
  const start = performance.now();
  const formatted = JSON.stringify(content, null, 2);
  const duration = performance.now() - start;

  if (duration > 10) {
    logger.warn(`[Overlay] JSON formatting took ${duration}ms (>10ms threshold)`);
  }
}
```

**Large JSON Warning**:
```typescript
const jsonString = JSON.stringify(content, null, 2);
const sizeKB = new Blob([jsonString]).size / 1024;

if (sizeKB > 50) {
  logger.warn(`[Overlay] Large debug content: ${sizeKB.toFixed(1)}KB`);
  // Optionally show warning in overlay: "Large debug content may affect performance"
}
```

## 8. Testing Strategy

### Decision

**Manual validation with test server examples**

### Rationale

1. **No Automated Tests Requested**: Per spec, manual validation is acceptable for this feature.

2. **Test Server Examples**: Create example responses in test-server/ directory showing:
   - Text with title
   - Text without title (backward compat)
   - Debug JSON with title
   - Debug JSON with nested structures
   - Mixed content (titled + untitled)
   - Edge cases (empty title, large JSON, circular refs)

3. **Browser Testing**: Manually test on:
   - Chrome (primary target)
   - Different viewport sizes (320px mobile, 768px tablet, 1920px desktop)
   - Dark mode (if applicable to Twitter/X)

### Test Cases

**Test Case 1: Title Display**
- Server returns text item with `title: "Sentiment Analysis"`
- Verify title appears above content in bold
- Verify title is visually distinct from content

**Test Case 2: Backward Compatibility**
- Server returns text item without title field
- Verify content displays normally (no title header)
- Verify no errors in console

**Test Case 3: Debug JSON Formatting**
- Server returns debug item with nested JSON object
- Verify JSON formatted with 2-space indentation
- Verify monospaced font used
- Verify scrollable if content exceeds viewport

**Test Case 4: Mixed Content**
- Server returns array: [text with title, text without title, debug with title]
- Verify all items render correctly in order
- Verify layout is consistent

**Test Case 5: Edge Cases**
- Empty title string → no title rendered
- Very long title → wraps gracefully
- Circular JSON → error message shown
- Invalid debug content (string instead of object) → error message

## References

- [MDN: JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [CSS white-space property](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)
- [TypeScript Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [Feature 004: Server Response Overlay Display](../004-response-overlay/spec.md)
- [Feature 005: Debug Metadata Display](../005-debug-info-display/spec.md) - prior art for debug content
