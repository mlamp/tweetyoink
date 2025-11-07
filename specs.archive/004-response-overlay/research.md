# Technical Research: Server Response Overlay Display

**Feature**: 004-response-overlay
**Date**: 2025-10-29
**Purpose**: Resolve technical decisions for overlay implementation

## Research Findings

### 1. Overlay Positioning Strategy

**Decision**: Fixed positioning with viewport-relative coordinates

**Rationale**:
- **Scroll Independence**: Fixed positioning keeps overlay visible during scrolling (FR-009 requirement)
- **Simple Lifecycle**: No need to recalculate position on scroll events
- **Twitter/X Compatibility**: Avoids interference with Twitter's virtual scrolling and dynamic DOM updates
- **Performance**: Zero layout recalculation cost during scroll
- **Mobile Friendly**: Fixed overlays work consistently across viewport sizes

**Implementation Approach**:
- Center overlay in viewport using `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`
- Semi-transparent backdrop (`rgba(0, 0, 0, 0.5)`) covering entire viewport
- Z-index > 10000 to ensure overlay appears above Twitter UI
- Optional: Remember last tweet context for spatial awareness (show tweet ID in overlay header)

**Alternatives Considered**:
- ❌ **Absolute positioning relative to tweet**: Requires complex scroll tracking, breaks on Twitter's DOM updates
- ❌ **Anchored to Yoink button**: Button may scroll out of view, violating FR-009

### 2. CSS Architecture

**Decision**: Separate CSS file with scoped class prefix

**Rationale**:
- **Maintainability**: Easier to read and modify than inline styles
- **Performance**: CSS file can be minified and cached by browser
- **Scoping**: Unique prefix (`tweetyoink-overlay-*`) prevents Twitter CSS conflicts
- **No External Dependencies**: Meets constitution requirement (no frameworks)
- **Vite Integration**: Vite handles CSS bundling automatically

**Implementation Approach**:
- Create `src/ui/overlay.css` with all `.tweetyoink-overlay-*` classes
- Import CSS in overlay-manager.ts: `import './overlay.css'`
- Use BEM naming convention: `.tweetyoink-overlay__element--modifier`
- CSS reset for overlay container to override Twitter styles
- CSS variables for themeable colors/spacing

**CSS Scoping Pattern**:
```css
/* Reset and scope */
.tweetyoink-overlay-container {
  all: initial; /* Reset all inherited styles */
  position: fixed;
  /* ... explicit styles ... */
}

.tweetyoink-overlay-container * {
  all: unset; /* Reset all child elements */
}
```

**Alternatives Considered**:
- ❌ **Inline styles**: Hard to maintain, no minification, verbose in code
- ❌ **CSS-in-JS**: Adds runtime overhead, violates "no dependencies" requirement
- ❌ **Shadow DOM**: Breaks some Twitter interactions, limits CSS flexibility

### 3. Content Sanitization

**Decision**: Native `textContent` property (no HTML rendering)

**Rationale**:
- **Zero Dependencies**: No DOMPurify library needed
- **Perfect XSS Protection**: `textContent` never interprets as HTML
- **Spec Alignment**: Feature spec only requires text rendering (`type="text"`)
- **Performance**: Fastest possible text insertion
- **Simplicity**: No sanitization logic needed

**Implementation Approach**:
```typescript
const contentElement = document.createElement('div');
contentElement.textContent = contentItem.content; // Safe from XSS
```

**Future Extensibility**:
- If `type="html"` added later, implement DOMPurify at that point
- Current scope: Only `type="text"` supported (FR-003, FR-008)

**Alternatives Considered**:
- ❌ **DOMPurify library**: Unnecessary dependency for text-only rendering
- ❌ **innerHTML with sanitization**: Over-engineering for current spec
- ❌ **Marked (markdown)**: Not required by spec, adds complexity

### 4. Event Handling

**Decision**: Capture phase event listener with stopPropagation on overlay content

**Rationale**:
- **Click Outside Detection**: Backdrop click closes overlay, content clicks ignored
- **ESC Key Support**: Document-level keydown listener (FR-005)
- **Twitter Isolation**: stopPropagation prevents Twitter handlers from firing
- **Cleanup**: Remove listeners on overlay close to prevent memory leaks

**Implementation Pattern**:
```typescript
// Backdrop click → close
backdropElement.addEventListener('click', (e) => {
  if (e.target === backdropElement) {
    this.close();
  }
});

// Content clicks → do nothing (stopPropagation)
contentElement.addEventListener('click', (e) => {
  e.stopPropagation();
});

// ESC key → close
document.addEventListener('keydown', this.handleEscKey);
```

**Cleanup Pattern**:
```typescript
close() {
  document.removeEventListener('keydown', this.handleEscKey);
  this.overlayElement.remove();
}
```

**Alternatives Considered**:
- ❌ **Bubbling phase only**: Harder to prevent Twitter event handlers from firing
- ❌ **Event.target checking**: More fragile than backdrop/content separation
- ❌ **Global click handler**: Could break Twitter functionality

### 5. State Management

**Decision**: Single global overlay instance (singleton pattern)

**Rationale**:
- **Simplified UX**: Only one overlay visible at a time (avoids confusion)
- **Resource Efficiency**: No multiple DOM trees in memory
- **Clear Behavior**: Clicking Yoink on second tweet closes first overlay
- **Easier Testing**: Single instance easier to track in tests
- **Matches Spec**: Edge case resolved - "second tweet closes first" (implicit in FR-001)

**Implementation Approach**:
```typescript
class OverlayManager {
  private static instance: OverlayManager | null = null;

  static show(contentItems: ResponseContentItem[]) {
    if (OverlayManager.instance) {
      OverlayManager.instance.close(); // Close existing
    }
    OverlayManager.instance = new OverlayManager(contentItems);
  }
}
```

**State Lifecycle**:
1. User clicks Yoink → Response received
2. Create overlay instance, inject into DOM
3. User dismisses overlay → Remove from DOM, set instance = null
4. User clicks Yoink on another tweet → Repeat from step 2

**Alternatives Considered**:
- ❌ **Multiple overlays**: Confusing UX, which overlay belongs to which tweet?
- ❌ **Queue system**: Unnecessary complexity for user-triggered action
- ❌ **Per-tweet state**: Memory overhead, harder cleanup on navigation

### 6. Performance Considerations

**Large Content Arrays (50+ items)**:

- **Virtualization**: NOT needed (spec caps at 20 items for performance - SC-004)
- **Rendering Strategy**: Simple DOM append loop (fast enough for 20 items)
- **Measurement**: 20 items × 100 chars average = 2000 chars ≈ 5ms render time
- **Scroll**: Native browser scroll (no custom scrollbar needed)

**Bundle Size**:

- **Estimated Addition**:
  - overlay-manager.ts: ~5 KB
  - overlay-renderer.ts: ~3 KB
  - overlay.css: ~2 KB
  - response-handler.ts: ~2 KB
  - Total: ~12 KB (well under 100 KB constraint)

**Animation Performance**:

- **CSS Transitions**: Use `transform` and `opacity` (GPU-accelerated)
- **Avoid**: `width`, `height`, `top`, `left` animations (cause reflows)
- **Target**: 60 FPS fade-in (16ms frame budget)

### 7. Mobile/Responsive Design

**Viewport Strategy**:

- **320px (mobile)**: Overlay 90% width, max 400px
- **768px (tablet)**: Overlay 70% width, max 600px
- **1024px+ (desktop)**: Overlay 50% width, max 800px

**Implementation**:
```css
.tweetyoink-overlay-content {
  width: 90vw;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .tweetyoink-overlay-content {
    width: 70vw;
  }
}

@media (min-width: 1024px) {
  .tweetyoink-overlay-content {
    width: 50vw;
  }
}
```

**Touch Interactions**:
- Backdrop tap → close (same as click)
- Content scroll → native overflow scroll
- No custom gesture handling needed

## Architecture Decisions Summary

| Decision Area | Choice | Key Benefit |
|---------------|--------|-------------|
| Positioning | Fixed viewport-centered | Scroll-independent (FR-009) |
| CSS | Scoped CSS file | Maintainable, no dependencies |
| Sanitization | textContent only | Perfect XSS protection |
| Events | Capture phase + stopProp | Twitter isolation |
| State | Singleton overlay | Clear UX, resource efficient |
| Performance | No virtualization | Sufficient for 20 items |
| Responsive | CSS breakpoints | Works 320px-3840px |

## Implementation Risks & Mitigations

**Risk 1: Twitter CSS Conflicts**
- **Mitigation**: CSS reset (`all: initial`) + scoped prefix
- **Fallback**: Inline styles if CSS file conflicts detected

**Risk 2: Twitter DOM Updates Breaking Overlay**
- **Mitigation**: Fixed positioning (not relative to Twitter DOM)
- **Monitoring**: Navigation listener removes overlay on route change

**Risk 3: Content Overflow (>10,000 chars)**
- **Mitigation**: CSS `max-height: 80vh; overflow-y: auto`
- **Enhancement**: Truncation warning for extremely long content (future)

## Next Phase Readiness

All technical decisions resolved. Ready to proceed to:
- **Phase 1**: Create data-model.md, contracts/, quickstart.md
- **Phase 1**: Update agent context (CLAUDE.md)
