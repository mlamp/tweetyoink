# API Contracts

**Feature**: 007-chrome-store-publish

## No Contracts Required

This feature does not require API contracts because it is **build tooling automation**, not a user-facing or API-driven feature.

### Why No Contracts?

1. **No External APIs**: This feature does not interact with external services via HTTP/REST/GraphQL. The only external interaction is manual upload to Chrome Web Store dashboard (not automated).

2. **No Internal APIs**: No new service-to-service communication within the extension. This is purely build-time scripting.

3. **No Data Exchange**: The feature creates ZIP files and manages version numbers in JSON files, but these are file system operations, not API calls.

### File Format "Contracts"

While there are no API contracts, the feature does interact with specific file formats:

**package.json** (existing, standard npm format):
```json
{
  "name": "tweetyoink",
  "version": "0.1.0",
  ...
}
```

**public/manifest.json** (existing, Chrome Extension Manifest V3 format):
```json
{
  "manifest_version": 3,
  "name": "TweetYoink",
  "version": "0.1.0",
  ...
}
```

**CHANGELOG.md** (new, follows Keep a Changelog format):
```markdown
## [0.1.0] - 2025-11-01
### Added
- Feature description
```

These formats are well-established industry standards, not custom contracts requiring specification.

### Future Consideration

If Feature 007 is extended to include **Chrome Web Store API integration** (currently in Out of Scope), then this directory would contain:
- `chrome-web-store-api.yaml` - OpenAPI spec for Chrome Web Store API interactions
- `upload-request.schema.json` - Request payload schema
- `upload-response.schema.json` - Response payload schema

But for the current scope (manual upload with automated packaging), no contracts are needed.
