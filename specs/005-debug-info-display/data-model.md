# Data Model: Debug Metadata Display

**Feature**: 005-debug-info-display
**Date**: 2025-10-31
**Phase**: 1 (Design)

## Core Interfaces

### DebugContentItem

Extends existing `ResponseContentItem` with debug-specific semantics.

```typescript
/**
 * Debug content item detected via metadata.is_debug flag
 * Content field contains JSON string with structured debug data
 */
export interface DebugContentItem extends ResponseContentItem {
  type: 'text'; // Always text type
  content: string; // JSON string to be parsed
  metadata: {
    is_debug: true; // Required flag for debug detection
    title?: string; // Optional title (e.g., "Debug Information")
    timestamp?: string; // When debug block was generated
    [key: string]: unknown; // Extensible for future metadata
  };
}
```

**Usage**:
```typescript
function isDebugBlock(item: ResponseContentItem): item is DebugContentItem {
  return item.metadata?.is_debug === true;
}
```

---

### DebugData

Structured data parsed from debug block JSON content.

```typescript
/**
 * Parsed debug data structure from server
 * Contains orchestrator decisions, agent analyses, metrics, and request metadata
 */
export interface DebugData {
  /** Orchestrator's decision flags and reasoning */
  orchestrator_decisions?: OrchestratorDecisions;

  /** Array of agent execution details */
  agent_analyses?: AgentAnalysis[];

  /** Performance metrics for each agent execution */
  execution_metrics?: ExecutionMetric[];

  /** Metadata about the original tweet request */
  request_metadata?: RequestMetadata;

  /** Extensible for future debug sections */
  [key: string]: unknown;
}
```

**Notes**:
- All fields are optional (graceful degradation if server sends partial data)
- Unknown keys preserved for forward compatibility
- Parsing validates top-level object structure only (no deep schema validation)

---

### OrchestratorDecisions

Orchestrator's analysis decisions and reasoning.

```typescript
/**
 * Orchestrator decision flags and reasoning
 */
export interface OrchestratorDecisions {
  /** Whether tweet needs fact-checking */
  needs_fact_check?: boolean;

  /** Whether deeper research is required */
  needs_deeper_research?: boolean;

  /** High bias detected in content */
  high_bias_detected?: boolean;

  /** Likely propaganda content */
  propaganda_likely?: boolean;

  /** Array of reasoning strings explaining decisions */
  reasons?: string[];

  /** Extensible for future decision flags */
  [key: string]: unknown;
}
```

**Example**:
```json
{
  "needs_fact_check": true,
  "high_bias_detected": false,
  "reasons": [
    "Tweet contains unverified statistical claim",
    "Source credibility needs verification"
  ]
}
```

---

### AgentAnalysis

Individual agent's execution details and analysis output.

```typescript
/**
 * Agent execution record with analysis output
 */
export interface AgentAnalysis {
  /** Agent identifier (e.g., "bias_analyzer", "fact_checker") */
  agent?: string;

  /** LLM model used by agent (e.g., "claude-3-5-sonnet-20241022") */
  model?: string;

  /** Which section of analysis this belongs to */
  section?: string;

  /** Structured analysis output from agent */
  structured_analysis?: Record<string, unknown>;

  /** Raw text output from agent (if structured_analysis not available) */
  raw_output?: string;

  /** Extensible for future agent metadata */
  [key: string]: unknown;
}
```

**Example**:
```json
{
  "agent": "bias_analyzer",
  "model": "claude-3-5-sonnet-20241022",
  "section": "bias_detection",
  "structured_analysis": {
    "bias_score": 0.3,
    "detected_techniques": ["loaded_language", "emotional_appeal"]
  }
}
```

---

### ExecutionMetric

Performance metrics for agent execution.

```typescript
/**
 * Performance metrics for a single agent execution
 */
export interface ExecutionMetric {
  /** Agent identifier matching AgentAnalysis.agent */
  agent?: string;

  /** LLM model used */
  model?: string;

  /** Processing time in milliseconds */
  processing_time_ms?: number;

  /** Token counts (input, output, total) */
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };

  /** Temperature parameter used for LLM call */
  temperature?: number;

  /** Extensible for future metrics */
  [key: string]: unknown;
}
```

**Example**:
```json
{
  "agent": "bias_analyzer",
  "model": "claude-3-5-sonnet-20241022",
  "processing_time_ms": 1234,
  "tokens": {
    "input": 450,
    "output": 120,
    "total": 570
  },
  "temperature": 0.0
}
```

---

### RequestMetadata

Metadata about the original tweet request.

```typescript
/**
 * Metadata about the tweet that was analyzed
 */
export interface RequestMetadata {
  /** Tweet author username */
  author?: string;

  /** Tweet URL */
  url?: string;

  /** Whether tweet has media attachments */
  has_media?: boolean;

  /** Number of media attachments */
  media_count?: number;

  /** Character length of tweet text */
  text_length?: number;

  /** Tweet type (tweet, retweet, quote, reply) */
  tweet_type?: string;

  /** Extensible for future request metadata */
  [key: string]: unknown;
}
```

**Example**:
```json
{
  "author": "@elonmusk",
  "url": "https://twitter.com/elonmusk/status/123456789",
  "has_media": true,
  "media_count": 2,
  "text_length": 280,
  "tweet_type": "tweet"
}
```

---

## UI State (Internal)

### CollapsibleSectionState

State tracking for collapsible debug sections (not needed with `<details>` implementation).

```typescript
/**
 * State for collapsible debug sections
 * NOTE: Using native <details>/<summary> elements means browser manages state.
 * This interface is for documentation only - no actual state tracking needed.
 */
export interface CollapsibleSectionState {
  /** Section identifier */
  sectionId: 'orchestrator' | 'agents' | 'metrics' | 'request';

  /** Whether section is currently expanded */
  isExpanded: boolean; // Managed by browser via <details open>
}
```

**Implementation Note**: With `<details>` elements, this state is managed entirely by the browser. No JavaScript state tracking required. If we need to programmatically control sections in the future, we can query `details.open` attribute.

---

## Validation Rules

### Debug Block Detection

```typescript
/**
 * Validate that a content item is a debug block
 */
function isValidDebugBlock(item: ResponseContentItem): item is DebugContentItem {
  // Must have is_debug flag
  if (item.metadata?.is_debug !== true) {
    return false;
  }

  // Must be text type
  if (item.type !== 'text') {
    logger.warn('[DebugValidator] Debug block has non-text type:', item.type);
    return false;
  }

  // Must have non-empty content
  if (typeof item.content !== 'string' || item.content.trim() === '') {
    logger.warn('[DebugValidator] Debug block has empty content');
    return false;
  }

  return true;
}
```

### JSON Content Validation

```typescript
/**
 * Validate and parse debug JSON content
 */
function validateDebugContent(content: string): DebugData | null {
  try {
    const parsed = JSON.parse(content);

    // Must be object (not array, string, null, etc.)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      logger.warn('[DebugValidator] Debug content is not an object');
      return null;
    }

    // At least one known section should exist (lenient validation)
    const hasAnySection =
      'orchestrator_decisions' in parsed ||
      'agent_analyses' in parsed ||
      'execution_metrics' in parsed ||
      'request_metadata' in parsed;

    if (!hasAnySection) {
      logger.warn('[DebugValidator] Debug content has no recognized sections');
      // Still return parsed data - may have future sections we don't recognize yet
    }

    return parsed as DebugData;
  } catch (error) {
    logger.warn('[DebugValidator] Failed to parse debug JSON:', error);
    return null;
  }
}
```

**Validation Philosophy**:
- Lenient validation (accept partial data)
- Graceful degradation (render what's available)
- Forward compatibility (ignore unknown sections)
- Developer-friendly errors (log warnings, don't crash)

---

## Error Handling

### Malformed JSON

```typescript
/**
 * Render error state for malformed debug JSON
 */
function renderDebugError(rawContent: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'debug-block debug-error';

  const title = document.createElement('h3');
  title.textContent = 'Debug Information (Parse Error)';
  container.appendChild(title);

  const errorMsg = document.createElement('p');
  errorMsg.className = 'error-message';
  errorMsg.textContent = 'Failed to parse debug JSON. Raw content displayed below.';
  container.appendChild(errorMsg);

  const rawContentPre = document.createElement('pre');
  rawContentPre.className = 'debug-raw-content';
  rawContentPre.textContent = rawContent; // Safe (textContent, not innerHTML)
  container.appendChild(rawContentPre);

  return container;
}
```

### Missing Sections

```typescript
/**
 * Render debug block with graceful handling of missing sections
 */
function renderDebugBlock(item: DebugContentItem): HTMLElement {
  const debugData = validateDebugContent(item.content);

  if (!debugData) {
    return renderDebugError(item.content);
  }

  const container = document.createElement('div');
  container.className = 'debug-block';

  // Render each section if present (skip if undefined)
  if (debugData.orchestrator_decisions) {
    container.appendChild(
      renderDebugSection('Orchestrator Decisions', debugData.orchestrator_decisions)
    );
  }

  if (debugData.agent_analyses) {
    container.appendChild(
      renderDebugSection('Agent Analyses', debugData.agent_analyses)
    );
  }

  if (debugData.execution_metrics) {
    container.appendChild(
      renderDebugSection('Execution Metrics', debugData.execution_metrics)
    );
  }

  if (debugData.request_metadata) {
    container.appendChild(
      renderDebugSection('Request Metadata', debugData.request_metadata)
    );
  }

  // If no sections rendered, show empty state
  if (container.children.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'debug-empty';
    emptyMsg.textContent = 'Debug data contains no recognized sections.';
    container.appendChild(emptyMsg);
  }

  return container;
}
```

---

## Type Guards

```typescript
/**
 * Type guard for DebugContentItem
 */
export function isDebugContentItem(item: ResponseContentItem): item is DebugContentItem {
  return item.metadata?.is_debug === true;
}

/**
 * Type guard for checking if debug data has orchestrator decisions
 */
export function hasOrchestratorDecisions(data: DebugData): data is DebugData & { orchestrator_decisions: OrchestratorDecisions } {
  return 'orchestrator_decisions' in data && typeof data.orchestrator_decisions === 'object';
}

/**
 * Type guard for checking if debug data has agent analyses
 */
export function hasAgentAnalyses(data: DebugData): data is DebugData & { agent_analyses: AgentAnalysis[] } {
  return 'agent_analyses' in data && Array.isArray(data.agent_analyses);
}

// Similar type guards for other sections...
```

---

## Integration with Existing Types

### Modified ParsedResponse (response-handler.ts)

```typescript
export interface ParsedResponse {
  /** Whether response has displayable content */
  hasContent: boolean;

  /** Filtered content items (type="text", not debug) */
  contentItems: ResponseContentItem[];

  /** Debug blocks (only in development mode) */
  debugItems?: DebugContentItem[]; // NEW: Optional debug blocks

  /** Reason for no content (if hasContent is false) */
  emptyReason?: 'empty-array' | 'no-text-items' | 'non-array-result' | 'error-response';
}
```

**Backward Compatibility**: `debugItems` is optional, so existing code continues to work without modification.

---

## Size Estimates

**Typical Debug Block**:
- JSON size: 10-20KB (uncompressed)
- Parsed object: ~50-100 DOM nodes
- Memory footprint: ~100-200KB (including DOM)

**Large Debug Block (edge case)**:
- JSON size: 80-100KB (max per SC-006)
- Parsed object: ~200-300 DOM nodes
- Memory footprint: ~500KB-1MB (acceptable for development tool)

**Performance Impact**: Negligible. Modern browsers handle 100KB JSON and 300 DOM nodes easily.

---

## Future Extensions

**Possible Enhancements** (out of scope for this feature):
1. Search/filter within debug sections
2. Export debug data to JSON file
3. Compare debug output across multiple tweets
4. Syntax highlighting for JSON (requires dependency)
5. Collapsible nested objects (recursive rendering)
6. Debug data persistence across overlay sessions

**Interface Extensibility**: All interfaces use `[key: string]: unknown` to support forward compatibility.
