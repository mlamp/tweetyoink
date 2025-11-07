# API Contract Updates for Feature 006

**Feature**: Add Tweet and Author URLs to Data Schema
**Contract Version**: 1.1.0 (updated from 1.0.0)
**Date**: 2025-11-01

## Contract Location

The API contracts for this feature have been updated in the original contract files:

**Primary Contract**: [`specs/003-config-endpoint/contracts/async-response-api.yaml`](../../003-config-endpoint/contracts/async-response-api.yaml)

## Changes Made

### 1. TweetData Schema
- **Added**: `url` field as required
  - Type: `string`
  - Description: Tweet permalink URL
  - Example: `"https://x.com/username/status/1234567890"`
  - Added to `required` array

### 2. Author Schema
- **Added**: `profileUrl` field as required
  - Type: `string`
  - Description: Author profile URL
  - Example: `"https://x.com/username"`
  - Added to `required` array

### 3. Version Update
- **Version**: Incremented from `1.0.0` to `1.1.0` (MINOR bump)
- **Rationale**: Adding new required fields is a MINOR change (additive, non-breaking for compliant consumers)

### 4. Examples Updated
- **simpleTweet**: Added `url` and `profileUrl` fields
- **quoteTweetWithVideo**: Added `url` and `profileUrl` fields to both main tweet and parent tweet

## Version History Entry

The following entry was added to the version history in `async-response-api.yaml`:

```yaml
version_history:
  - version: "1.1.0"
    date: "2025-11-01"
    changes:
      - "Added url field to TweetData schema (required)"
      - "Added profileUrl field to Author schema (required)"
      - "Both fields constructed via fallback if DOM extraction fails"
      - "Updated all examples to include new URL fields"
```

## Migration Notes

### For Backend Consumers

**Handling Old vs New Versions**:
```python
# Example: Python backend handling both versions
def parse_tweet_data(data: dict) -> TweetData:
    # New version (1.1.0+) - has URL fields
    if 'url' in data and 'author' in data and 'profileUrl' in data['author']:
        return TweetData(
            url=data['url'],
            author=Author(
                profile_url=data['author']['profileUrl'],
                # ... other fields
            ),
            # ... other fields
        )

    # Old version (1.0.0) - construct URLs if missing
    else:
        url = data.get('url')
        if not url and data.get('author', {}).get('handle'):
            # Fallback: construct tweet URL from handle + timestamp
            handle = data['author']['handle']
            # Note: tweet ID extraction would be more complex
            url = f"https://x.com/{handle}/status/unknown"

        profile_url = data['author'].get('profileUrl')
        if not profile_url and data.get('author', {}).get('handle'):
            profile_url = f"https://x.com/{data['author']['handle']}"

        return TweetData(
            url=url or "",
            author=Author(
                profile_url=profile_url or "",
                # ... other fields
            ),
            # ... other fields
        )
```

### For Extension Developers

**New Requirements**:
- `TweetData.url` is now `string` (not `string | null`)
- `AuthorData.profileUrl` is new required field of type `string`
- Both fields guaranteed non-null via fallback construction
- See `data-model.md` for implementation details

## Contract Synchronization Checklist

Per Constitution Principle VII:

- [x] TypeScript interfaces updated in `src/types/tweet-data.ts`
- [x] Contract YAML updated in `specs/003-config-endpoint/contracts/async-response-api.yaml`
- [x] Contract version incremented (1.0.0 → 1.1.0)
- [x] Version history section updated with date and change description
- [x] All examples updated to include new fields
- [ ] Both changes committed together in same commit (will be done during implementation)

## Related Documentation

- **Feature Spec**: [`../spec.md`](../spec.md)
- **Implementation Plan**: [`../plan.md`](../plan.md)
- **Data Model**: [`../data-model.md`](../data-model.md)
- **Research**: [`../research.md`](../research.md)
