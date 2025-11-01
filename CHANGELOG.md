# Changelog

All notable changes to TweetYoink will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Feature 008**: Overlay enhancements with titles and debug JSON support
  - Optional title field for all content types (text, image, debug, link)
  - Titles render as bold headers above content blocks
  - New "debug" content type for formatted JSON display
  - Native JSON.stringify() with 2-space indentation
  - Monospaced font rendering for debug JSON
  - Error handling for circular references and non-serializable content
  - Performance warnings for large JSON (>50KB)
  - Mobile responsive and dark mode support for debug content
  - 100% backward compatible with v1.1.0 API responses
- Comprehensive CHANGELOG.md following Keep a Changelog format
- Changelog workflow documentation in quickstart.md
- Release notes guidance for Chrome Web Store submissions

### Changed
- ResponseContentItem interface now supports optional `title` field
- Content field now accepts `string | object` union type (for debug JSON)
- Response format contract updated from v1.1.0 to v1.2.0

### Deprecated
- `metadata.title` field (use top-level `title` field instead)

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Debug JSON rendering uses textContent for XSS protection

## [0.1.0] - 2025-11-01

### Added
- **Feature 007**: Automated Chrome Web Store publishing workflow
  - One-command ZIP package creation with `npm run package`
  - Automated version synchronization between package.json and manifest.json
  - Version bump commands: `npm run version:patch|minor|major`
  - Git tag and commit creation on version bumps
- **Feature 006**: Tweet and author profile URLs in captured data
  - Tweet URL field in TweetData interface
  - Author profile URL field in UserContext interface
  - Full URL tracking for tweets, retweets, and quoted tweets
- **Feature 005**: Debug metadata display in development mode
  - Debug information panel showing capture metadata
  - Collapsible debug sections for better organization
  - Request/response timing information
  - Detailed error information display
- **Feature 004**: Server response overlay display
  - Visual overlay showing server responses after tweet capture
  - Support for text, markdown, and media responses
  - Newline preservation in server messages
  - XSS protection for user-generated content
- **Feature 003**: Configurable backend endpoint
  - Settings UI for backend URL configuration
  - Async POST workflow with polling support
  - Custom headers configuration
  - Request retry logic with exponential backoff
- **Feature 002**: Post view "Yoink" button
  - Context-aware button injection on tweet pages
  - Full tweet data extraction (text, author, media, metrics)
  - Support for regular tweets, retweets, and quoted tweets
  - Media extraction (images, videos, GIFs)
- **Feature 001**: Initial Chrome extension setup
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

[Unreleased]: https://github.com/mlamp/tweetyoink/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mlamp/tweetyoink/releases/tag/v0.1.0
[0.0.1]: https://github.com/mlamp/tweetyoink/releases/tag/v0.0.1
