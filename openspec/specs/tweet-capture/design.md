# Tweet Capture - Technical Design

## Context

Tweet capture is the core capability of TweetYoink. It enables users to extract structured tweet data from Twitter/X by clicking an injected "Yoink" button. The implementation must handle Twitter's frequently changing DOM structure through defensive extraction patterns while maintaining high reliability and performance.

## Goals / Non-Goals

**Goals:**
- Reliable button injection across all tweet types (standalone, replies, retweets, quotes)
- Comprehensive data extraction with structured JSON output
- Defensive DOM parsing with multi-tier fallback selectors
- Performance: <500ms button injection, <1s extraction and console output
- Support 50+ captures per session without memory leaks

**Non-Goals:**
- Backend integration (handled by separate capability)
- UI beyond the injected button
- Screenshot-based extraction
- Automated/background captures
- Tweet editing or modification

## Decisions

### Decision: Button Injection Strategy

**Approach:** Use MutationObserver to detect tweet DOM changes, locate anchor button ("More" menu primary, Grok fallback), traverse to action bar container, inject Yoink button as first child.

**Alternatives Considered:**
1. **Static injection on page load** - Rejected: Misses dynamically loaded tweets from infinite scroll
2. **Polling-based detection** - Rejected: Performance overhead, less efficient than MutationObserver
3. **Event delegation** - Rejected: Cannot reliably detect when new tweets render

**Rationale:** MutationObserver provides efficient DOM change detection with minimal performance impact. Anchor-based positioning (More menu → Grok fallback) provides stable reference points despite Twitter UI changes.

### Decision: Extraction Architecture

**Approach:** Modular extractor pattern with specialized modules per data type (text, author, metrics, media, links), orchestrated by main tweet-extractor.

**File Structure:**
```
src/extractors/
├── tweet-extractor.ts      # Main orchestrator
├── text-extractor.ts        # Text content
├── author-extractor.ts      # Author metadata
├── metrics-extractor.ts     # Engagement data
├── media-extractor.ts       # Images/videos/GIFs
├── linkcard-extractor.ts    # Link previews
└── selectors.ts             # Centralized selector definitions
```

**Alternatives Considered:**
1. **Monolithic single-file extractor** - Rejected: Hard to maintain, test, and extend
2. **Class-based extractors** - Rejected: Unnecessary complexity for functional extraction logic

**Rationale:** Modular functions enable independent testing, clear separation of concerns, and easy extension. Each extractor handles one data type with its own fallback logic.

### Decision: Defensive Selector Tiers

**Approach:** Three-tier selector hierarchy with confidence scoring
- **Tier 1 (Primary, confidence 1.0):** `data-testid` attributes (most stable)
- **Tier 2 (Secondary, confidence 0.5):** `aria-label` and semantic attributes
- **Tier 3 (Tertiary, confidence 0.3):** Element structure and class patterns

**Alternatives Considered:**
1. **Single selector approach** - Rejected: Brittle, fails completely on Twitter updates
2. **AI/ML-based extraction** - Rejected: Overkill, adds complexity and latency
3. **XPath selectors** - Rejected: Less performant than CSS selectors, harder to maintain

**Rationale:** Tiered fallbacks provide graceful degradation. Confidence scores inform downstream systems about data quality. Primary selectors use Twitter's most stable identifiers.

### Decision: Data Schema Design

**Approach:** Nested JSON structure with grouped entities:
```typescript
interface TweetData {
  text: string;
  url: string;
  author: Author;
  timestamp: string; // ISO 8601
  metrics: Metrics;
  media: Media[];
  linkCard: LinkCard | null;
  tweetType: TweetType;
  parent: TweetData | null; // For quotes/retweets
  metadata: ExtractionMetadata;
}
```

**Alternatives Considered:**
1. **Flat structure** - Rejected: Harder to parse, loses semantic grouping
2. **Arrays of key-value pairs** - Rejected: Poor TypeScript support, verbose

**Rationale:** Nested objects match LLM consumption patterns. TypeScript interfaces provide compile-time safety. Grouping (author, metrics) improves readability.

### Decision: Error Handling Strategy

**Approach:** Never throw, always return null for missing fields. Log warnings for failed extractions. Include confidence scores in output.

**Alternatives Considered:**
1. **Throw on critical failures** - Rejected: Breaks partial extraction use case
2. **Retry logic** - Rejected: DOM is stable during extraction, retries unlikely to help
3. **Silent failures** - Rejected: Hides issues, prevents monitoring

**Rationale:** Partial data is better than no data. Null values + warnings enable debugging while maintaining extraction resilience.

## Risks / Trade-offs

**Risk:** Twitter DOM changes break selectors
- **Mitigation:** Three-tier fallbacks, selector health checks, confidence scoring, telemetry logging
- **Trade-off:** Increased code complexity vs single-selector simplicity

**Risk:** Performance degradation with many tweets
- **Mitigation:** Efficient MutationObserver configuration, event delegation, cleanup on navigation
- **Trade-off:** Memory for DOM observers vs missing dynamically loaded tweets

**Risk:** Button injection conflicts with Twitter updates
- **Mitigation:** Namespace CSS classes, Z-index management, non-blocking injection
- **Trade-off:** Some visual integration polish vs reliability

## Migration Plan

**Phase 1: Core Infrastructure (002-post-view-yoink)**
1. Implement button injector with MutationObserver
2. Create base extractors for text, author, metrics
3. Add console logging with JSON formatting
4. Deploy and gather telemetry on selector success rates

**Phase 2: Enhanced Extraction (006-add-tweet-urls)**
1. Add URL extraction to tweet-extractor
2. Enhance author-extractor with profileUrl
3. Implement URL construction fallbacks
4. Update TypeScript types to require url/profileUrl fields

**Rollback:** Button injection can be disabled via feature flag if critical issues arise

## Open Questions

None - all architectural questions resolved in design phase.
