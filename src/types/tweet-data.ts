/**
 * TypeScript interfaces for tweet data extraction
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

/**
 * Author profile information nested within TweetData
 */
export interface AuthorData {
  handle: string | null;          // Username without @ (e.g., "TestUser123")
  displayName: string | null;     // Full display name (e.g., "Test User Account")
  isVerified: boolean;            // True if verified badge present
  profileImageUrl: string | null; // Avatar image URL
}

/**
 * Engagement metrics nested within TweetData
 */
export interface MetricsData {
  replyCount: number | null;
  retweetCount: number | null;
  likeCount: number | null;
  bookmarkCount: number | null;
  viewCount: number | null;
}

/**
 * Single media attachment (image, video, GIF)
 */
export interface MediaData {
  type: 'image' | 'video' | 'gif';
  url: string;                  // Primary media URL
  thumbnailUrl: string | null;  // Thumbnail for videos
  altText: string | null;       // Accessibility alt text
  width: number | null;         // Native width in pixels
  height: number | null;        // Native height in pixels
}

/**
 * Link preview card nested within TweetData
 */
export interface LinkCardData {
  url: string;              // Destination URL
  title: string | null;     // Card title
  description: string | null; // Card description
  imageUrl: string | null;  // Card preview image
  domain: string | null;    // Display domain (e.g., "whitehouse.gov")
}

/**
 * Tweet classification flags nested within TweetData
 */
export interface TweetTypeFlags {
  isRetweet: boolean;
  isQuote: boolean;
  isReply: boolean;
}

/**
 * Extraction tier used for selector fallback tracking
 */
export type ExtractionTier = 'primary' | 'secondary' | 'tertiary';

/**
 * Extraction quality metadata nested within TweetData
 */
export interface ExtractionMetadata {
  confidence: number;           // 0.0 to 1.0
  capturedAt: string;           // ISO 8601 timestamp of capture
  extractionTier: ExtractionTier; // Which selector tier succeeded
  warnings: string[];           // List of non-fatal issues
  duration: number;             // Extraction time in milliseconds
}

/**
 * Primary data structure representing extracted tweet information
 */
export interface TweetData {
  // Tweet content
  text: string | null;

  // Author information
  author: AuthorData;

  // Temporal data
  timestamp: string | null; // ISO 8601 format or null

  // Engagement metrics
  metrics: MetricsData;

  // Media content
  media: MediaData[];

  // Link preview
  linkCard: LinkCardData | null;

  // Tweet classification
  tweetType: TweetTypeFlags;

  // Parent/quoted tweet (recursive)
  parent: TweetData | null;

  // Extraction quality metadata
  metadata: ExtractionMetadata;
}

/**
 * Extraction error information
 */
export interface ExtractionError {
  code: string;              // Error code (e.g., "SELECTOR_FAILURE")
  message: string;           // Human-readable error
  failedFields: string[];    // List of fields that failed extraction
  context: Record<string, unknown>; // Additional debug info
}

/**
 * Wrapper containing TweetData plus extraction outcome metadata
 */
export interface ExtractionResult {
  success: boolean;
  data: TweetData | null;
  error: ExtractionError | null;
}

/**
 * Selector type for extraction strategies
 */
export type SelectorType = 'css' | 'xpath' | 'text';

/**
 * Single selector strategy with extraction function
 */
export interface SelectorStrategy {
  selector: string;                // CSS selector or XPath
  type: SelectorType;              // Selector type
  extractor: (element: Element) => string | null; // Extraction function
  validator?: (value: string) => boolean; // Optional validation
  confidence: number;              // Base confidence score (0.0-1.0)
}

/**
 * Three-tier fallback selector configuration
 */
export interface SelectorConfig {
  primary: SelectorStrategy;
  secondary: SelectorStrategy | null;
  tertiary: SelectorStrategy | null;
}

/**
 * Button status for lifecycle tracking
 */
export type ButtonStatus =
  | 'not-injected'
  | 'injecting'
  | 'ready'
  | 'capturing'
  | 'error';

/**
 * Button state tracking for injected Yoink button
 */
export interface ButtonState {
  tweetId: string;              // Unique identifier for tweet
  status: ButtonStatus;
  element: HTMLButtonElement | null;
  injectedAt: number;           // Performance.now() timestamp
  lastInteraction: number | null; // Last click timestamp
}

/**
 * Field extraction result for confidence calculation
 */
export interface FieldExtractionResult {
  name: string;
  extracted: boolean;
  tier: ExtractionTier;
}

/**
 * Type guard for TweetData
 */
export function isTweetData(value: unknown): value is TweetData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    'author' in value &&
    'metadata' in value
  );
}

/**
 * Type guard for successful ExtractionResult
 */
export function isExtractionSuccess(
  result: ExtractionResult
): result is ExtractionResult & { data: TweetData } {
  return result.success && result.data !== null;
}
