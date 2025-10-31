/**
 * Type definitions for server response overlay display
 * Feature: 004-response-overlay
 */

export interface ResponseContentItem {
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

export interface OverlayState {
  /** Whether overlay is currently visible */
  isVisible: boolean;

  /** Content items being displayed */
  contentItems: ResponseContentItem[];

  /** Tweet ID that triggered this overlay (for context) */
  associatedTweetId: string;

  /** When overlay was created (for debugging) */
  createdAt: number; // timestamp
}

export interface OverlayConfig {
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

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  maxItems: 50,
  maxContentLength: 10000,
  animationDurationMs: 200,
  zIndex: 10001,
  backdropOpacity: 0.5,
};

/**
 * Type guard to check if content item is renderable
 */
export function isRenderableContentItem(item: ResponseContentItem): boolean {
  return item.type === 'text' && typeof item.content === 'string';
}

// ============================================================================
// Debug Metadata Display Types (Feature: 005-debug-info-display)
// ============================================================================

/**
 * Debug content item detected via metadata.is_debug flag
 * Content field contains JSON string with structured debug data
 */
export interface DebugContentItem extends ResponseContentItem {
  type: 'text';
  content: string; // JSON string to be parsed
  metadata: {
    is_debug: true;
    title?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * Parsed debug data structure from server
 * Contains orchestrator decisions, agent analyses, metrics, and request metadata
 */
export interface DebugData {
  orchestrator_decisions?: OrchestratorDecisions;
  agent_analyses?: AgentAnalysis[];
  execution_metrics?: ExecutionMetric[];
  request_metadata?: RequestMetadata;
  [key: string]: unknown; // Forward compatibility
}

/**
 * Orchestrator decision flags and reasoning
 */
export interface OrchestratorDecisions {
  needs_fact_check?: boolean;
  needs_deeper_research?: boolean;
  high_bias_detected?: boolean;
  propaganda_likely?: boolean;
  reasons?: string[];
  [key: string]: unknown; // Forward compatibility
}

/**
 * Agent execution record with analysis output
 */
export interface AgentAnalysis {
  agent?: string;
  model?: string;
  section?: string;
  structured_analysis?: Record<string, unknown>;
  raw_output?: string;
  [key: string]: unknown; // Forward compatibility
}

/**
 * Performance metrics for a single agent execution
 */
export interface ExecutionMetric {
  agent?: string;
  model?: string;
  processing_time_ms?: number;
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
  temperature?: number;
  [key: string]: unknown; // Forward compatibility
}

/**
 * Metadata about the tweet that was analyzed
 */
export interface RequestMetadata {
  author?: string;
  url?: string;
  has_media?: boolean;
  media_count?: number;
  text_length?: number;
  tweet_type?: string;
  [key: string]: unknown; // Forward compatibility
}

/**
 * Type guard for DebugContentItem
 */
export function isDebugContentItem(
  item: ResponseContentItem
): item is DebugContentItem {
  return item.metadata?.is_debug === true;
}

/**
 * Type guard for checking if debug data has orchestrator decisions
 */
export function hasOrchestratorDecisions(
  data: DebugData
): data is DebugData & { orchestrator_decisions: OrchestratorDecisions } {
  return (
    'orchestrator_decisions' in data &&
    typeof data.orchestrator_decisions === 'object'
  );
}

/**
 * Type guard for checking if debug data has agent analyses
 */
export function hasAgentAnalyses(
  data: DebugData
): data is DebugData & { agent_analyses: AgentAnalysis[] } {
  return 'agent_analyses' in data && Array.isArray(data.agent_analyses);
}

/**
 * Type guard for checking if debug data has execution metrics
 */
export function hasExecutionMetrics(
  data: DebugData
): data is DebugData & { execution_metrics: ExecutionMetric[] } {
  return 'execution_metrics' in data && Array.isArray(data.execution_metrics);
}

/**
 * Type guard for checking if debug data has request metadata
 */
export function hasRequestMetadata(
  data: DebugData
): data is DebugData & { request_metadata: RequestMetadata } {
  return (
    'request_metadata' in data && typeof data.request_metadata === 'object'
  );
}
