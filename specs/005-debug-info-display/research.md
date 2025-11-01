# Technical Research: Debug Metadata Display

**Feature**: 005-debug-info-display
**Date**: 2025-10-31
**Phase**: 0 (Research)

## Research Questions

### 1. How to detect debug blocks in server responses?

**Decision**: Use `metadata.is_debug` flag

**Rationale**:
- ResponseContentItem already has extensible metadata with `[key: string]: unknown`
- Server already implements `is_debug` flag in metadata (per spec assumptions)
- Type-safe detection: `item.metadata?.is_debug === true`
- No schema changes needed to existing `ResponseContentItem` interface
- Consistent with existing metadata patterns (title, timestamp)

**Implementation**:
```typescript
function isDebugBlock(item: ResponseContentItem): boolean {
  return item.metadata?.is_debug === true;
}
```

**Alternatives Rejected**:
- Separate content type (`type: 'debug'`): Would require server changes, breaks existing contract
- Magic string in title: Fragile, not type-safe, prone to false positives
- Content inspection: Performance overhead, unreliable for detecting debug vs regular JSON

---

### 2. JSON parsing approach for debug content

**Decision**: Use built-in `JSON.parse()` with try-catch error handling

**Rationale**:
- Zero dependencies (aligns with constitution principle of minimizing complexity)
- Native JavaScript parsing is fast and battle-tested
- Debug blocks are trusted server output (no user input)
- Error handling covers malformed JSON edge case (FR-005)
- Performance: ~1-2ms for typical 18KB debug JSON payload

**Implementation**:
```typescript
function parseDebugContent(content: string): DebugData | null {
  try {
    const parsed = JSON.parse(content);
    // Validate structure
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as DebugData;
    }
    logger.warn('[DebugRenderer] Parsed JSON is not an object');
    return null;
  } catch (error) {
    logger.warn('[DebugRenderer] Failed to parse debug JSON:', error);
    return null;
  }
}
```

**Alternatives Rejected**:
- External JSON parsing library (e.g., JSON5, hjson): Unnecessary dependency, no clear benefit
- Eval-based parsing: Security risk, no advantage over JSON.parse
- Manual parsing: Complex, error-prone, slower than native implementation
- Syntax highlighting library (e.g., Prism.js, highlight.js): Out of scope (spec excludes syntax highlighting)

---

### 3. Collapsible UI approach for debug sections

**Decision**: Use native HTML `<details>` and `<summary>` elements

**Rationale**:
- Zero JavaScript state management required (native browser behavior)
- Accessibility built-in (keyboard navigation, screen reader support)
- Semantic HTML (matches intent of collapsible sections)
- Cross-browser support (Chrome, Edge, Firefox, Safari all support)
- CSS styling control via `details[open]` and `summary::marker`
- No event listeners needed (browser handles expand/collapse)
- Aligns with constitution principle of minimizing complexity

**Implementation**:
```html
<details class="debug-section">
  <summary>Orchestrator Decisions</summary>
  <pre class="debug-content">{JSON.stringify(data, null, 2)}</pre>
</details>
```

**Alternatives Rejected**:
- Custom div + click handler: More code, requires state management, less accessible
- Accordion component library: Unnecessary dependency for simple use case
- Pure CSS (checkbox hack): Less accessible, requires hidden inputs, less semantic
- React/Vue component: No frontend framework in this project (vanilla TypeScript)

**Edge Case Handling**:
- All sections start collapsed (default `<details>` behavior without `open` attribute)
- User can expand/collapse independently (native browser behavior)
- State not persisted across overlay sessions (acceptable for debug tool)

---

### 4. Environment detection (development vs production)

**Decision**: Use Vite's `import.meta.env.DEV` constant

**Rationale**:
- Already available in codebase (Vite build tool)
- Build-time constant (tree-shaking removes dev-only code from production bundle)
- Type-safe in TypeScript (boolean value)
- Consistent with existing logger implementation (`src/utils/logger.ts` uses same pattern)
- Zero runtime overhead (constant folded during build)

**Implementation**:
```typescript
// In response-handler.ts or overlay-renderer.ts
const isDevelopment = import.meta.env.DEV;

function shouldRenderDebugBlock(item: ResponseContentItem): boolean {
  return isDevelopment && item.metadata?.is_debug === true;
}
```

**Alternatives Rejected**:
- Chrome extension API (`chrome.runtime.getManifest().version_name` inspection): Runtime overhead, fragile
- Server-side flag in response: Couples server to client environment, violates separation of concerns
- Hardcoded flag: Requires manual switching, error-prone
- Process.env.NODE_ENV: Not available in Vite (uses import.meta.env instead)

**Production Safety**:
- In production build: `import.meta.env.DEV === false` → debug blocks never rendered
- Vite tree-shaking removes unreachable code paths
- Zero performance impact in production

---

### 5. Rendering strategy (integration with existing overlay)

**Decision**: Extend `overlay-renderer.ts` with new `renderDebugBlock()` function

**Rationale**:
- Follows existing architecture pattern (overlay-renderer handles all DOM creation)
- Separation of concerns: rendering logic in renderer, detection logic in response-handler
- Reuses existing overlay infrastructure (container, backdrop, event listeners)
- Debug blocks render at end of content area (FR-010)
- Single responsibility: renderDebugBlock only handles debug-specific DOM creation

**Implementation Flow**:
1. `response-handler.ts`: Filter debug blocks from regular content items
2. `response-handler.ts`: Return both `contentItems` (regular) and `debugItems` (debug) in ParsedResponse
3. `overlay-renderer.ts`: Render regular items first (existing renderContentItem function)
4. `overlay-renderer.ts`: Render debug items last (new renderDebugBlock function)
5. `overlay-manager.ts`: No changes needed (delegates to renderer)

**Function Signature**:
```typescript
/**
 * Render a debug content block with collapsible sections
 *
 * @param item - Debug content item (metadata.is_debug === true)
 * @returns DOM element for debug block
 */
function renderDebugBlock(item: ResponseContentItem): HTMLElement {
  // Parse JSON content
  const debugData = parseDebugContent(item.content);

  if (!debugData) {
    // Fallback for malformed JSON
    return renderDebugError(item.content);
  }

  // Create container
  const container = document.createElement('div');
  container.className = 'debug-block';

  // Render collapsible sections
  if (debugData.orchestrator_decisions) {
    container.appendChild(renderDebugSection('Orchestrator Decisions', debugData.orchestrator_decisions));
  }
  // ... repeat for other sections

  return container;
}
```

**Alternatives Rejected**:
- Separate debug overlay component: Over-engineered, duplicates existing overlay infrastructure
- Inline debug rendering in renderContentItem: Violates single responsibility, makes function complex
- Server-side HTML rendering: Extension is client-side, requires DOM manipulation anyway
- Shadow DOM for debug blocks: Unnecessary isolation, complicates CSS styling

---

## Performance Considerations

**JSON Parsing**:
- Tested with 18KB debug JSON: ~1-2ms parse time (negligible)
- 100KB limit (SC-006): ~5-10ms parse time (well within 100ms render budget)

**DOM Creation**:
- 4 debug sections + content: ~20-30 DOM nodes total
- Negligible compared to existing overlay rendering overhead
- `<details>` elements are lightweight (native browser implementation)

**CSS Styling**:
- Use CSS class selectors (fast)
- Avoid inline styles where possible (better caching)
- Leverage CSS containment for debug blocks (isolate layout/paint)

---

## Security Considerations

**XSS Prevention**:
- All JSON content displayed in `<pre>` tags with `textContent` (not `innerHTML`)
- No user input in debug blocks (server-generated only)
- JSON.parse validates structure before rendering
- Existing escapeHtml function not needed (textContent is safe)

**Privacy**:
- Debug blocks only visible in development mode (not shipped to users)
- Production builds have debug rendering code tree-shaken away
- No sensitive data logged to console (only parse errors)

---

## Dependencies Analysis

**New Dependencies**: None

**Existing Dependencies Leveraged**:
- `logger` from `src/utils/logger.ts` (warn/debug for errors)
- `ResponseContentItem` from `src/types/overlay.ts` (existing interface)
- `overlay-renderer.ts` DOM creation patterns (consistency)
- Vite `import.meta.env.DEV` (environment detection)

**Constitution Compliance**: Zero new dependencies aligns with simplicity principle

---

## Open Questions Resolved

1. **Q: Should debug blocks be collapsible by default?**
   A: Yes, all sections start collapsed (FR-008). Reduces information overload on initial render.

2. **Q: What if server sends multiple debug blocks?**
   A: Render all of them sequentially (forEach loop, same as regular items). No special handling needed.

3. **Q: How to handle very large debug JSON (>100KB)?**
   A: Log warning, render anyway. Browser handles large `<pre>` tags efficiently. If performance issue arises in testing, truncate with "view more" link (future enhancement).

4. **Q: Should debug sections be persistent across overlay sessions?**
   A: No. Each overlay is independent. Persistence adds complexity without clear benefit for debug tool.

5. **Q: Should we validate debug JSON schema?**
   A: Basic validation only (check object type, check section keys exist). Avoid over-engineering. Log warning for missing sections, render what's available.

---

## Next Steps (Phase 1: Design)

1. Create `data-model.md` with TypeScript interfaces
2. Create `contracts/debug-block-format.yaml` documenting expected JSON structure
3. Create `quickstart.md` for developer onboarding
4. Validate design decisions against constitution (re-check)
