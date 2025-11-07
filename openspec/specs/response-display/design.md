# Response Display - Technical Design

## Context

The response display capability shows server processing results to users in an overlay UI on the Twitter/X page. It must handle multiple content types (text, image, debug), support loading states for async operations, and provide a polished user experience that integrates naturally with Twitter's interface.

## Goals / Non-Goals

**Goals:**
- Display text, image, and debug content from server responses
- Support optional titles for all content types
- Show loading indicators during processing (sync and async)
- Adaptive progress display based on server data
- Development-only debug information rendering
- Responsive overlay (320px to 3840px viewports)

**Non-Goals:**
- Interactive content (buttons, forms within overlay)
- Content editing or manipulation
- Multi-tab overlay persistence
- Push notifications or sound alerts

## Decisions

### Decision: Overlay Implementation Approach

**Approach:** Custom overlay injected into Twitter DOM with fixed positioning:
```
src/ui/
├── overlay.ts        # Overlay manager and lifecycle
├── overlay.css       # Styling with Twitter-compatible design
├── content-renderers.ts  # Content type renderers
└── loading-indicator.ts  # Loading state component
```

**Positioning Strategy:**
- Fixed position relative to viewport
- Z-index above Twitter content but below browser UI
- Center or near captured tweet (configurable)

**Alternatives Considered:**
1. **Browser popup window** - Rejected: Breaks user flow, poor mobile UX
2. **Twitter modal** - Rejected: Cannot reliably hijack Twitter's modal system
3. **Inline expansion** - Rejected: Disrupts timeline layout

**Rationale:** Custom overlay provides full control over positioning, styling, and lifecycle without Twitter DOM conflicts.

### Decision: Content Type Rendering Architecture

**Approach:** Renderer pattern with type-specific handlers:
```typescript
interface ContentRenderer {
  canRender(type: string): boolean;
  render(item: ResponseContentItem): HTMLElement;
}

class TextRenderer implements ContentRenderer { /* */ }
class ImageRenderer implements ContentRenderer { /* */ }
class DebugRenderer implements ContentRenderer { /* */ }

class ContentManager {
  private renderers: ContentRenderer[] = [
    new TextRenderer(),
    new ImageRenderer(),
    new DebugRenderer()
  ];

  renderContent(items: ResponseContentItem[]): HTMLElement[] {
    return items.map(item => {
      const renderer = this.renderers.find(r => r.canRender(item.type));
      return renderer ? renderer.render(item) : null;
    }).filter(Boolean);
  }
}
```

**Alternatives Considered:**
1. **Switch/case in single function** - Rejected: Hard to extend, violates open/closed principle
2. **Template strings** - Rejected: XSS risks, poor TypeScript support
3. **React/Vue components** - Rejected: Unnecessary dependency, bundle size increase

**Rationale:** Renderer pattern enables easy addition of new content types without modifying existing code. Clean separation of concerns per type.

### Decision: Debug Content Formatting

**Approach:** Use JSON.stringify with formatting + monospace CSS:
```typescript
function formatDebugContent(content: object): string {
  try {
    return JSON.stringify(content, null, 2); // 2-space indent
  } catch (e) {
    logger.error('[Overlay] Failed to serialize debug content:', e);
    return `Error: Cannot display debug content (${e.message})`;
  }
}
```

**CSS Styling:**
```css
.debug-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  white-space: pre-wrap;
  background: #1e1e1e; /* VSCode dark theme */
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}
```

**Alternatives Considered:**
1. **Syntax highlighting library (Prism.js, Highlight.js)** - Rejected: Adds 50KB+ to bundle for minor visual improvement
2. **HTML table for object properties** - Rejected: Poor for nested structures, harder to copy/paste
3. **Interactive JSON tree viewer** - Deferred: Can add later as enhancement

**Rationale:** JSON.stringify is lightweight, native, and produces copy-pasteable output. Monospace font with VSCode-inspired styling provides familiar developer experience.

### Decision: Loading Indicator Design

**Approach:** Smart Hybrid - Radial fill with adaptive data sources:
```typescript
interface LoadingIndicatorState {
  mode: 'radial-fill' | 'pulse-only';
  progress: number; // 0.0 to 1.0
  estimatedDuration?: number; // milliseconds
  startTime: number;
}

class LoadingIndicator {
  updateProgress(response: { progress?: number; estimatedDuration?: number }) {
    if (response.progress !== undefined) {
      // Server provided exact progress
      this.state.mode = 'radial-fill';
      this.state.progress = clamp(response.progress, 0, 1);
    } else if (response.estimatedDuration) {
      // Calculate progress from time elapsed
      const elapsed = Date.now() - this.state.startTime;
      this.state.mode = 'radial-fill';
      this.state.progress = Math.min(elapsed / response.estimatedDuration, 0.95);
    } else {
      // No progress data, use pulse animation
      this.state.mode = 'pulse-only';
    }
    this.render();
  }
}
```

**Visual Design:**
- Replace Yoink button icon with loading indicator
- Radial fill (circular progress) when progress data available
- Smooth pulse animation as fallback
- Match Twitter's color scheme (brand blue #1DA1F2)

**Alternatives Considered:**
1. **Center-screen modal loading** - Rejected: Blocks entire page, disruptive
2. **Progress bar below button** - Rejected: Adds vertical space, layout shift
3. **Text-only "Loading..."** - Rejected: Less engaging, no progress feedback

**Rationale:** In-button replacement keeps UI stable (no layout shift). Adaptive progress uses best available data while degrading gracefully.

### Decision: Title Rendering Strategy

**Approach:** Consistent header element for all content types:
```typescript
function renderContentItem(item: ResponseContentItem): HTMLElement {
  const container = document.createElement('div');
  container.className = 'content-item';

  // Add title if present
  if (item.title && item.title.trim()) {
    const title = document.createElement('h3');
    title.className = 'content-title';
    title.textContent = sanitize(item.title); // XSS protection
    container.appendChild(title);
  }

  // Render content based on type
  const content = renderByType(item.type, item.content);
  container.appendChild(content);

  return container;
}
```

**CSS Styling:**
```css
.content-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  color: #0f1419; /* Twitter text color */
}
```

**Alternatives Considered:**
1. **Type-specific title styling** - Rejected: Inconsistent UX, unnecessary complexity
2. **Bold first line of content** - Rejected: Doesn't work for images, poor semantic markup
3. **Inline prefix (e.g., "Title: content")** - Rejected: Ugly, hard to scan

**Rationale:** Consistent header element provides clear visual hierarchy. Semantic HTML (h3) improves accessibility.

### Decision: Development vs Production Mode Detection

**Approach:** Use Vite's import.meta.env.DEV flag:
```typescript
const IS_DEVELOPMENT = import.meta.env.DEV;

function shouldRenderDebug(item: ResponseContentItem): boolean {
  return IS_DEVELOPMENT && (
    item.type === 'debug' ||
    item.metadata?.is_debug === true
  );
}
```

**Build Configuration:**
- Development builds (`npm run build:dev`): IS_DEVELOPMENT = true
- Production builds (`npm run build`): IS_DEVELOPMENT = false, debug code tree-shaken

**Alternatives Considered:**
1. **Runtime environment variable** - Rejected: Can be manipulated by user, not truly compile-time
2. **Check for localhost URL** - Rejected: Backend could be localhost in production
3. **User setting toggle** - Rejected: Adds UI complexity, easy to accidentally enable

**Rationale:** Compile-time flag ensures debug code is completely removed from production builds. No performance cost, no risk of accidental exposure.

### Decision: Overlay Lifecycle Management

**Approach:** Single overlay instance, content swapping:
```typescript
class OverlayManager {
  private overlay: HTMLElement | null = null;

  show(content: ResponseContentItem[]): void {
    if (!this.overlay) {
      this.overlay = this.createOverlay();
      document.body.appendChild(this.overlay);
    }
    this.updateContent(content);
    this.overlay.classList.add('visible');
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.classList.remove('visible');
      // Keep DOM element for reuse
    }
  }

  destroy(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
```

**Cleanup Triggers:**
- User closes overlay (button, Escape, click outside)
- Page navigation detected (Twitter route change)
- Extension unload

**Alternatives Considered:**
1. **Create/destroy on each show/hide** - Rejected: Performance overhead, no benefit
2. **Multiple overlays for concurrent requests** - Rejected: Confusing UX, screen clutter
3. **Never destroy, always hide** - Rejected: Potential memory leak

**Rationale:** Reuse overlay element for performance. Destroy on navigation prevents DOM pollution.

## Risks / Trade-offs

**Risk:** Overlay conflicts with Twitter UI updates
- **Mitigation:** High z-index, namespaced CSS classes, defensive positioning
- **Trade-off:** May need updates when Twitter redesigns

**Risk:** Large debug JSON (50KB+) causes performance issues
- **Mitigation:** Scrollable container, lazy rendering for collapsed sections (future)
- **Trade-off:** Current implementation renders all content upfront

**Risk:** Loading indicator animation impacts performance
- **Mitigation:** Use CSS animations (GPU-accelerated), no JavaScript intervals
- **Trade-off:** Limited animation customization

**Risk:** XSS vulnerabilities in title/content rendering
- **Mitigation:** Sanitize all user-controlled strings, use textContent not innerHTML
- **Trade-off:** Cannot support rich formatting in titles

## Migration Plan

**Phase 1: Basic Overlay (004-response-overlay)**
1. Create overlay UI structure
2. Implement text and image renderers
3. Add close button and Escape key handler
4. Position near tweet with fixed positioning

**Phase 2: Debug Support (005, 008-overlay-enhancements)**
1. Add debug content renderer
2. Implement JSON formatting
3. Add development mode detection
4. Create title support for all types

**Phase 3: Loading States (009-async-loading)**
1. Create LoadingIndicator component
2. Implement button replacement strategy
3. Add adaptive progress calculation
4. Integrate with async polling service

**Rollback:** Each phase builds on previous. Can roll back to earlier phase if issues arise.

## Open Questions

None - all architectural questions resolved in design phase.
