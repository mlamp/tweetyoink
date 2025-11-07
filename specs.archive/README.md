# Archived Speckit Features

This directory contains the original feature specifications created with Speckit before migration to OpenSpec.

## Migration Status

**Migrated to OpenSpec on:** 2025-11-08

All 9 features have been consolidated into 4 OpenSpec capabilities in `openspec/specs/`:

### Capability Mapping

| Old Speckit Feature | New OpenSpec Capability | Status |
|---------------------|------------------------|--------|
| 001-initial-setup | N/A (project setup, not a capability) | Archived |
| 002-post-view-yoink | `tweet-capture` | ✅ Migrated |
| 003-config-endpoint | `backend-integration` | ✅ Migrated |
| 004-response-overlay | `response-display` | ✅ Migrated |
| 005-debug-info-display | `response-display` | ✅ Migrated |
| 006-add-tweet-urls | `tweet-capture` | ✅ Migrated |
| 007-chrome-store-publish | `release-management` | ✅ Migrated |
| 008-overlay-enhancements | `response-display` | ✅ Migrated |
| 009-async-loading | `response-display` | ✅ Migrated |

## Why This Archive Exists

This archive is kept for reference in case:
- We need to review original implementation details
- There are edge cases or requirements not captured in the OpenSpec migration
- Historical context is needed for understanding design decisions

## OpenSpec Capabilities

The new OpenSpec structure can be found at:
- `openspec/specs/tweet-capture/` - Extract tweet data from Twitter/X DOM
- `openspec/specs/backend-integration/` - Configure and communicate with backend
- `openspec/specs/response-display/` - Display server responses in overlay
- `openspec/specs/release-management/` - Package and publish to Chrome Web Store

See `openspec/AGENTS.md` for complete OpenSpec workflow documentation.

## When to Delete This Archive

This directory can be safely deleted once:
1. All OpenSpec capabilities have been validated in production
2. Team confirms no information was lost in migration
3. Sufficient time has passed (recommend 3-6 months)

---

**Note:** Do not create new features in this directory. All new work should use OpenSpec at `openspec/changes/[change-id]/`.
