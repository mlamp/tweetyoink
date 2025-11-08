# Changelog Format Guide

This document describes the changelog format conventions for TweetYoink.

## Format Philosophy

The TweetYoink changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles with OpenSpec capability-based organization.

## Capability Organization

Changes are organized by **OpenSpec capability** instead of individual feature numbers. This provides better context and makes it easier to understand the impact of changes.

**Current Capabilities:**
- **`tweet-capture`**: Tweet extraction, button injection, URL tracking, DOM parsing
- **`backend-integration`**: Server communication, configuration, polling, authentication
- **`response-display`**: Overlay UI, loading states, content rendering, debug display
- **`release-management`**: Versioning, packaging, Chrome Web Store publishing

## Change Categories

Following Keep a Changelog conventions:

- **Added**: New features or capabilities
- **Changed**: Changes to existing functionality
- **Deprecated**: Features marked for removal in future versions
- **Removed**: Features removed in this version
- **Fixed**: Bug fixes
- **Security**: Security-related changes

## Entry Template

Use this template when adding a new release:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- **`capability-name`**: Brief description of what was added
  - Implementation detail or user-facing benefit
  - Additional context if needed

### Changed
- **`capability-name`**: What changed and why
  - Breaking changes should be clearly marked
  - Migration instructions if applicable

### Fixed
- **`capability-name`**: Bug fix description
  - What was broken
  - What now works correctly

### Security
- **`capability-name`**: Security improvement description
  - Vulnerability fixed or security enhancement added
```

## Example Entries

### Good Examples

```markdown
## [1.2.0] - 2025-11-15

### Added
- **`tweet-capture`**: Thread capture support
  - Automatically detect and capture entire Twitter threads
  - Preserves tweet order and relationships
  - Handles "Show more replies" lazy loading
- **`backend-integration`**: Multiple backend profiles
  - Switch between work/personal backends
  - Profile import/export support
  - Per-profile authentication

### Fixed
- **`response-display`**: Overlay positioning on mobile viewports
  - Fixed overlay clipping on screens <768px wide
  - Improved touch interaction on mobile devices
```

### Examples to Avoid

❌ **Too vague:**
```markdown
### Added
- Improved thread support
- Fixed bugs
```

❌ **Missing capability context:**
```markdown
### Added
- Thread capture feature with lazy loading
```

❌ **Too technical (internal details):**
```markdown
### Changed
- Refactored SelectorFallbackChain to use WeakMap caching
- Updated webpack config for tree-shaking optimization
```

## Versioning

TweetYoink follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR (X.0.0)**: Breaking changes to API contract or user workflows
- **MINOR (x.Y.0)**: Backward-compatible new features
- **PATCH (x.y.Z)**: Backward-compatible bug fixes

## Writing Guidelines

1. **User-focused**: Describe benefits, not implementation details
2. **Concise**: One clear sentence per bullet point
3. **Specific**: Include what changed, not just that something changed
4. **Capability-scoped**: Always prefix with capability name for context

## Unreleased Section

Keep an `[Unreleased]` section at the top for changes not yet released:

```markdown
## [Unreleased]

### Added
- **`tweet-capture`**: Keyboard shortcuts for faster capture
  - Alt+Y to yoink focused/hovered tweet
  - Alt+T to yoink entire thread
```

When releasing, rename `[Unreleased]` to the version number and date.

## Maintenance

- Keep entries in **reverse chronological order** (newest first)
- Update comparison links at the bottom when releasing new versions
- Remove "Nothing yet" placeholders when adding actual changes
- Archive very old entries (>2 years) to CHANGELOG_ARCHIVE.md if changelog becomes unwieldy
