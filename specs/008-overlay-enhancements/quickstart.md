# Quickstart: Overlay Titles and Debug JSON

**Feature**: 008-overlay-enhancements
**Audience**: Extension developers and server implementers
**Time to First Enhancement**: ~10 minutes

## Prerequisites

Before you start, ensure you have:

- ✅ TweetYoink extension running with Feature 004 (overlay display)
- ✅ Test server configured and responding to tweet captures
- ✅ Basic understanding of JSON and TypeScript

## Quick Start (3 Steps)

### 1. Add Titles to Existing Content

Update your server responses to include optional title fields:

**Before (v1.1.0)**:
```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "content": "Positive sentiment detected (95% confidence)"
    }
  ]
}
```

**After (v1.2.0)**:
```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "title": "Sentiment Analysis",
      "content": "Positive sentiment detected (95% confidence)"
    }
  ]
}
```

**Result**: Title appears as bold header above content in overlay! 🎉

### 2. Add Debug JSON Content

Include structured debug data for inspection:

```json
{
  "status": "completed",
  "result": [
    {
      "type": "debug",
      "title": "Processing Metrics",
      "content": {
        "processing_time_ms": 826,
        "model": "gpt-4",
        "tokens_used": 1234,
        "confidence": 0.95
      }
    }
  ]
}
```

**Result**: JSON displays with 2-space indentation in monospaced font!

### 3. Test the Enhancements

1. Start your test server with enhanced responses
2. Click Yoink button on a tweet
3. Verify overlay shows:
   - Titles as bold headers
   - Debug JSON formatted and readable
   - All content renders correctly

---

## Complete Usage Examples

### Example 1: Mixed Content with Titles

Perfect for comprehensive analysis results:

```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "title": "Sentiment Analysis",
      "content": "Positive sentiment detected with 95% confidence"
    },
    {
      "type": "text",
      "title": "Key Topics",
      "content": "AI, machine learning, technology, innovation"
    },
    {
      "type": "text",
      "title": "Engagement Prediction",
      "content": "High engagement expected: 500+ likes, 100+ retweets"
    },
    {
      "type": "debug",
      "title": "Processing Details",
      "content": {
        "total_time_ms": 826,
        "model": "gpt-4-turbo",
        "stages_completed": ["sentiment", "topics", "engagement"]
      }
    }
  ]
}
```

**When to use**: Production analysis responses with clear sections

### Example 2: Debug-Heavy Response

Perfect for development and troubleshooting:

```json
{
  "status": "completed",
  "result": [
    {
      "type": "debug",
      "title": "Tweet Metadata",
      "content": {
        "author": "@elonmusk",
        "url": "https://x.com/elonmusk/status/123",
        "has_media": true,
        "media_count": 2,
        "text_length": 280,
        "tweet_type": "quote"
      }
    },
    {
      "type": "debug",
      "title": "Analysis Pipeline",
      "content": {
        "stages": [
          {
            "name": "sentiment",
            "status": "completed",
            "duration_ms": 145,
            "result": { "score": 0.95, "label": "positive" }
          },
          {
            "name": "entity_extraction",
            "status": "completed",
            "duration_ms": 203,
            "entities": ["AI", "Tesla", "innovation"]
          }
        ],
        "total_duration_ms": 826,
        "success": true
      }
    }
  ]
}
```

**When to use**: Development servers, debugging, power users

### Example 3: Backward Compatible (No Titles)

Keep existing servers working without changes:

```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "content": "Analysis complete: Positive sentiment"
    },
    {
      "type": "text",
      "content": "Detected topics: technology, AI, future"
    }
  ]
}
```

**When to use**: Migration period, legacy server support

---

## Common Patterns

### Pattern 1: Summary + Details

Combine high-level summary with detailed debug info:

```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "title": "Quick Summary",
      "content": "Positive tech-focused tweet with high engagement potential"
    },
    {
      "type": "debug",
      "title": "Detailed Analysis",
      "content": {
        "sentiment": { "score": 0.95, "label": "positive" },
        "topics": ["technology", "AI", "innovation"],
        "engagement": { "predicted_likes": 500, "predicted_retweets": 100 }
      }
    }
  ]
}
```

### Pattern 2: Multi-Stage Processing

Show results from each processing stage:

```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "title": "Stage 1: Sentiment",
      "content": "Positive (95% confidence)"
    },
    {
      "type": "text",
      "title": "Stage 2: Topics",
      "content": "AI, technology, innovation"
    },
    {
      "type": "debug",
      "title": "Stage 3: Metrics",
      "content": {
        "processing_time": "826ms",
        "tokens_used": 1234,
        "model": "gpt-4"
      }
    }
  ]
}
```

### Pattern 3: Conditional Debug Info

Show debug info only in development:

```javascript
// Server-side example (Node.js/Express)
const isDevelopment = process.env.NODE_ENV === 'development';

const response = {
  status: 'completed',
  result: [
    {
      type: 'text',
      title: 'Analysis Result',
      content: analysisResult
    }
  ]
};

// Add debug info only in development
if (isDevelopment) {
  response.result.push({
    type: 'debug',
    title: 'Debug Info',
    content: {
      processing_time_ms: processingTime,
      model: modelName,
      request_id: requestId,
      timestamp: new Date().toISOString()
    }
  });
}

res.json(response);
```

---

## Troubleshooting

### Problem: Title not showing

**Symptom**: Title field present but no header appears in overlay

**Solutions**:
1. Check title is non-empty string:
   ```json
   { "title": "Sentiment Analysis" }  ✅ Works
   { "title": "" }                     ❌ No header (treated as missing)
   { "title": "   " }                  ❌ No header (whitespace-only)
   ```

2. Verify title is string type, not number or boolean:
   ```json
   { "title": "Analysis" }  ✅ Works
   { "title": 123 }         ❌ Invalid (must be string)
   ```

### Problem: Debug JSON not formatted

**Symptom**: Debug content shows as plain object or [object Object]

**Solutions**:
1. Ensure type is exactly "debug":
   ```json
   { "type": "debug", "content": {...} }   ✅ Formatted
   { "type": "Debug", "content": {...} }   ❌ Case-sensitive
   { "type": "json", "content": {...} }    ❌ Wrong type
   ```

2. Content must be object, not stringified JSON:
   ```json
   { "type": "debug", "content": { "key": "value" } }      ✅ Works
   { "type": "debug", "content": '{"key": "value"}' }      ❌ String, not object
   ```

### Problem: Circular reference error

**Symptom**: Debug content with circular references shows error message

**Solution**: Remove circular references before sending:

```javascript
// Server-side example
const data = {
  user: { name: "Alice" },
  metadata: {}
};
data.metadata.user = data.user; // Circular ref

// Option 1: Remove circular refs manually
const safe = {
  user: data.user,
  metadata: { userId: data.user.id } // Reference by ID instead
};

// Option 2: Use JSON.stringify() replacer
const stringified = JSON.stringify(data, (key, value) => {
  if (key === 'metadata') return { userId: value.user?.id };
  return value;
});
```

### Problem: Very large JSON causes performance issues

**Symptom**: Overlay loads slowly or browser becomes unresponsive

**Solutions**:
1. Limit debug content size to <50KB:
   ```javascript
   const jsonString = JSON.stringify(debugData);
   const sizeKB = new Blob([jsonString]).size / 1024;

   if (sizeKB > 50) {
     console.warn(`Debug content too large: ${sizeKB}KB`);
     // Truncate or summarize data
     debugData = summarize(debugData);
   }
   ```

2. Paginate or summarize large datasets:
   ```javascript
   // Instead of sending 1000 items:
   { "items": [...1000 items...] }

   // Send summary + sample:
   {
     "summary": { "total_count": 1000, "avg_value": 42 },
     "sample": [...first 10 items...]
   }
   ```

### Problem: Title contains HTML tags

**Symptom**: HTML tags visible as plain text in title

**Expected Behavior**: This is correct! Extension sanitizes titles for XSS protection.

**Solution**: Use plain text titles, not HTML:
```json
{ "title": "Sentiment Analysis" }                ✅ Good
{ "title": "<b>Sentiment</b> Analysis" }         ❌ Shows tags literally
{ "title": "Sentiment Analysis 📊" }             ✅ Emojis work
```

---

## Best Practices

### ✅ Do

- **Use descriptive titles**: "Sentiment Analysis" not "Result 1"
- **Keep titles concise**: Aim for 20-50 characters
- **Use title case or sentence case**: "Key Topics" or "Key topics"
- **Group related content**: Use titles to create logical sections
- **Limit debug content size**: Keep JSON under 50KB
- **Use debug type for technical data**: Metrics, configs, raw results
- **Test with real data**: Verify formatting looks good with actual content
- **Provide backward compatibility**: Support clients without v1.2.0 features

### ❌ Don't

- Don't use very long titles (>100 chars) - they wrap awkwardly
- Don't include HTML in titles - it's sanitized to plain text
- Don't stringify JSON for debug type - send object directly
- Don't send circular references in debug content - will error
- Don't send massive JSON (>100KB) - impacts performance
- Don't use title for content - title is header, content is body
- Don't forget title is optional - old responses still work

---

## Migration Guide

### Migrating from v1.1.0 to v1.2.0

**Step 1**: Review current responses

Identify where titles would improve clarity:
```json
// Before: All text looks the same
{
  "result": [
    { "type": "text", "content": "Positive sentiment (95%)" },
    { "type": "text", "content": "Topics: AI, tech" }
  ]
}

// After: Clear sections with titles
{
  "result": [
    { "type": "text", "title": "Sentiment", "content": "Positive (95%)" },
    { "type": "text", "title": "Topics", "content": "AI, tech" }
  ]
}
```

**Step 2**: Add titles incrementally

You don't have to update all responses at once:
```json
{
  "result": [
    { "type": "text", "title": "Summary", "content": "..." },    // New style
    { "type": "text", "content": "Additional info" }             // Old style (still works!)
  ]
}
```

**Step 3**: Add debug content for development

Useful for troubleshooting:
```json
{
  "result": [
    { "type": "text", "title": "Analysis", "content": "..." },
    ...(isDev ? [{
      "type": "debug",
      "title": "Debug Info",
      "content": { /* metrics */ }
    }] : [])
  ]
}
```

**Step 4**: Update documentation

Inform server developers about new capabilities.

---

## API Reference

### ResponseContentItem (v1.2.0)

```typescript
interface ResponseContentItem {
  type: 'text' | 'image' | 'debug' | 'link' | string;
  content: string | object;
  title?: string;              // NEW: Optional title
  metadata?: object;
}
```

### DebugContentItem (v1.2.0)

```typescript
interface DebugContentItem {
  type: 'debug';               // NEW: Debug content type
  content: object | unknown[]; // JSON-serializable data
  title?: string;
  metadata?: object;
}
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Content type: 'text', 'image', 'debug', 'link' |
| content | string \| object | Yes | Content payload (string for most types, object for debug) |
| title | string | No | **NEW**: Optional header text shown above content |
| metadata | object | No | Optional metadata (existing, unchanged) |

---

## Next Steps

After implementing basic titles and debug content:

1. **Experiment with layouts**: Try different title/content combinations
2. **Optimize debug content**: Find the right level of detail for your use case
3. **Gather feedback**: Ask users if titles improve readability
4. **Consider conditional debug**: Show debug info only to power users or in dev mode
5. **Monitor performance**: Check that large JSON doesn't impact UX

---

## Getting Help

If you encounter issues:

1. **Check API contract**: [response-format-v1.2.yaml](./contracts/response-format-v1.2.yaml)
2. **Review data model**: [data-model.md](./data-model.md)
3. **See research findings**: [research.md](./research.md)
4. **Test with examples**: Use the examples in this guide
5. **Open an issue**: Report bugs or request clarifications

---

**Last Updated**: 2025-11-01
**Related Docs**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/response-format-v1.2.yaml](./contracts/response-format-v1.2.yaml)
