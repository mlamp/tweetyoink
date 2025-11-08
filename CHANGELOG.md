# Changelog

All notable changes to TweetYoink will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For changelog format conventions, see `.github/CHANGELOG_TEMPLATE.md`.

## [Unreleased]

### Added
- Nothing yet

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet

## [0.4.0] - 2025-11-08

### Changed
- **BREAKING**: Migrated from Speckit to OpenSpec specification system
  - Consolidated 9 features into 4 capability-based specifications
  - New OpenSpec directory structure in `openspec/`
  - All Speckit artifacts archived in `specs.archive/` for reference
  - Updated CLAUDE.md with OpenSpec workflow
  - Added OpenSpec slash commands: `/openspec:proposal`, `/openspec:apply`, `/openspec:archive`
  - Constitutional principles now embedded in `openspec/project.md`

### Added
- **`response-display` capability**: Overlay enhancements with titles and debug JSON support
  - Optional title field for all content types (text, image, debug, link)
  - Titles render as bold headers above content blocks
  - New "debug" content type for formatted JSON display
  - Native JSON.stringify() with 2-space indentation
  - Monospaced font rendering for debug JSON
  - Error handling for circular references and non-serializable content
  - Performance warnings for large JSON (>50KB)
  - Mobile responsive and dark mode support for debug content
  - Loading indicators for async operations (from Feature 009)
  - 100% backward compatible with v1.1.0 API responses
- Comprehensive CHANGELOG.md following Keep a Changelog format
- Changelog workflow documentation in quickstart.md
- Release notes guidance for Chrome Web Store submissions
- OpenSpec CLI validation support (`openspec validate --specs --strict`)

### Removed
- Speckit directory structure (`.specify/`)
  - Memory and constitution files (now in `openspec/project.md`)
  - Speckit templates and scripts
  - Speckit slash commands (replaced with OpenSpec equivalents)

### Migration Guide

**Old Speckit Features → New OpenSpec Capabilities:**

| Old Feature | New Capability | Requirements |
|-------------|----------------|--------------|
| 002-post-view-yoink + 006-add-tweet-urls | `tweet-capture` | 21 |
| 003-config-endpoint | `backend-integration` | 19 |
| 004-response-overlay + 005-debug-info-display + 008-overlay-enhancements + 009-async-loading | `response-display` | 27 |
| 007-chrome-store-publish | `release-management` | 19 |
| 001-initial-setup | _(Project setup, archived)_ | - |

**Total**: 86 requirements, 159 scenarios

### Security
- Debug JSON rendering uses textContent for XSS protection

## [0.1.0] - 2025-11-01

### Added
- **`release-management` capability**: Automated Chrome Web Store publishing workflow
  - One-command ZIP package creation with `npm run package`
  - Automated version synchronization between package.json and manifest.json
  - Version bump commands: `npm run version:patch|minor|major`
  - Git tag and commit creation on version bumps
- **`tweet-capture` capability**: Tweet and author profile URLs in captured data
  - Tweet URL field in TweetData interface
  - Author profile URL field in UserContext interface
  - Full URL tracking for tweets, retweets, and quoted tweets
- **`response-display` capability**: Debug metadata display in development mode
  - Debug information panel showing capture metadata
  - Collapsible debug sections for better organization
  - Request/response timing information
  - Detailed error information display
- **`response-display` capability**: Server response overlay display
  - Visual overlay showing server responses after tweet capture
  - Support for text, markdown, and media responses
  - Newline preservation in server messages
  - XSS protection for user-generated content
- **`backend-integration` capability**: Configurable backend endpoint
  - Settings UI for backend URL configuration
  - Async POST workflow with polling support
  - Custom headers configuration
  - Request retry logic with exponential backoff
- **`tweet-capture` capability**: Post view "Yoink" button
  - Context-aware button injection on tweet pages
  - Full tweet data extraction (text, author, media, metrics)
  - Support for regular tweets, retweets, and quoted tweets
  - Media extraction (images, videos, GIFs)
- **`project-setup` _(archived)_**: Initial Chrome extension architecture
  - Chrome Extension Manifest V3 architecture
  - TypeScript 5.x with strict mode
  - Vite build system with @crxjs/vite-plugin
  - Chrome Storage API for settings
  - Icon generation scripts
  - CI/CD pipeline with GitHub Actions

### Changed
- Development mode now includes source maps for better debugging
- Build commands separated into production (`npm run build`) and development (`npm run build:dev`) modes

### Security
- Added comprehensive privacy policy (PRIVACY.md)
- Implemented XSS protection for overlay content
- Optional host permissions for user-configured backends only

## [0.0.1] - 2025-10-23

### Added
- Initial project scaffolding
- Basic Chrome extension structure
- TypeScript configuration

[Unreleased]: https://github.com/mlamp/tweetyoink/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/mlamp/tweetyoink/compare/v0.1.0...v0.4.0
[0.1.0]: https://github.com/mlamp/tweetyoink/releases/tag/v0.1.0
[0.0.1]: https://github.com/mlamp/tweetyoink/releases/tag/v0.0.1
