# Research: Chrome Web Store Publishing Automation

**Feature**: 007-chrome-store-publish
**Date**: 2025-11-01
**Status**: Complete

## Overview

This document captures research findings for automating the Chrome Web Store publishing workflow, specifically focusing on ZIP packaging and version management approaches.

## 1. Archiving Solution for ZIP Packaging

### Decision

**archiver** npm package

### Rationale

1. **Industry Standard with Active Maintenance**: 14.2M weekly downloads, 5,638 dependents, actively maintained (last updated March 2024). This is the most trusted and widely-used programmatic ZIP creation library in the Node.js ecosystem.

2. **Native Glob Pattern Support with Exclusions**: archiver provides built-in glob pattern support with `ignore` option, eliminating the need for separate glob libraries or manual file filtering. Critical for excluding development files (node_modules/, src/, .git/, .specify/, specs/, scripts/, *.log, .env*).

3. **Streaming Architecture for Performance**: Uses Node.js streams for memory efficiency, suitable for extensions with many assets. Aligns well with Vite's streaming build pipeline.

4. **TypeScript Support**: Excellent TypeScript definitions via `@types/archiver`, matches project's strict TypeScript requirements. Fits the existing pattern of TypeScript build scripts (scripts/generate-icons.ts).

### Alternatives Considered

- **bestzip** (326K weekly downloads): While offering native OS command optimization, it's in maintenance mode (last updated 4 years ago) and provides less control. Performance benefit negligible for extension sizes (~5-10MB). **Rejected** due to maintenance concerns and less consistent cross-platform behavior.

- **adm-zip** (8.7M weekly downloads): Simpler API but uses synchronous operations and in-memory buffering. Doesn't match streaming paradigm used in project. Lacks glob pattern support. **Rejected** for performance concerns and missing glob support.

- **deterministic-zip** (796 weekly downloads): Designed for reproducible builds but last updated 6 years ago. Not needed since Chrome Web Store doesn't require deterministic builds for submission. **Rejected** due to over-specialization and maintenance concerns.

- **jszip** (13.5M weekly downloads): Popular but last published 3 years ago (August 2022). Lacks native glob support and has known issues with deterministic builds. **Rejected** due to maintenance concerns and missing features.

### Implementation Notes

**Installation**:
```bash
npm install --save-dev archiver @types/archiver
```

**Integration Pattern**:
- Create `scripts/package.ts` following the same pattern as `scripts/generate-icons.ts`
- Use tsx shebang (`#!/usr/bin/env tsx`) for direct execution
- TypeScript with top-level async/await
- Clear console output with emoji prefixes for consistency
- Proper error handling with process.exit(1)

**Glob Pattern Example**:
```typescript
archive.glob('**/*', {
  cwd: 'dist',
  ignore: ['.vite/**']  // Exclude build artifacts
});
```

**Output Location**: Create `releases/` directory (gitignored) for ZIP files with version-stamped names (e.g., `tweetyoink-v0.1.0.zip`)

**npm Script**: `"package": "npm run build && tsx scripts/package.ts"` - chains build with packaging

**File Inclusion Simplification**: Since Vite with @crxjs/vite-plugin already copies necessary files to dist/ (manifest.json, icons, assets), script only needs to ZIP the entire dist/ directory plus LICENSE and README.md from root.

**Cross-Platform Support**: Pure JavaScript with no native dependencies, works identically on macOS, Linux, and Windows.

## 2. Version Management Solution

### Decision

Built-in `npm version` command with custom lifecycle hooks and TypeScript sync script

### Rationale

1. **Simplicity & Zero Dependencies**: Project already uses TypeScript and tsx for running scripts. No additional dependencies needed, maintaining lean dependency footprint.

2. **Perfect Fit for Chrome Extensions**: Chrome extensions are NOT published to npm - they're distributed via Chrome Web Store. Advanced automation features of semantic-release (npm publishing, release notes, CI/CD) are overkill.

3. **Explicit Control & Transparency**: Project follows manual, deliberate development approach (constitutional principles, Speckit workflow). Automatic version bumping from commit messages would bypass intentional feature planning process.

### Alternatives Considered

- **semantic-release** (22.8K stars, 2.4M weekly downloads): Requires conventional commits standard, designed for npm package publishing, provides fully automated releases. **Rejected** as too heavyweight for Chrome extension workflow. Automation conflicts with deliberate feature-based development.

- **release-it** (8.7K stars, 720K weekly downloads): Flexible and less opinionated, but still adds unnecessary complexity and dependencies. **Rejected** because npm version hooks can accomplish the same goal with less overhead.

- **sync-json** package: Last published 9 years ago. **Rejected** due to age and unnecessary dependency for simple TypeScript script.

- **genversion** package: Designed for generating version.ts files for client code, not for synchronizing manifest.json. **Rejected** as wrong tool for the job.

### Implementation Notes

**Approach**: Create `scripts/sync-version.ts` that reads package.json version and writes it to public/manifest.json. Hook this into npm version lifecycle.

**npm Scripts to Add**:
```json
{
  "scripts": {
    "version": "tsx scripts/sync-version.ts && git add public/manifest.json",
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major"
  }
}
```

**Usage Examples**:
```bash
# Bump patch version (0.1.0 → 0.1.1)
npm run version:patch

# Bump minor version (0.1.0 → 0.2.0)
npm run version:minor

# Bump major version (0.1.0 → 1.0.0)
npm run version:major

# Pre-release versions also available
npm version prepatch    # 0.1.0 → 0.1.1-0
npm version preminor    # 0.1.0 → 0.2.0-0
npm version premajor    # 0.1.0 → 1.0.0-0
npm version prerelease  # 0.1.0-0 → 0.1.0-1
```

**Workflow When Running `npm version patch`**:
1. npm bumps version in package.json
2. **version** lifecycle hook runs: `sync-version.ts` copies version to manifest.json, then stages file with `git add`
3. npm creates git commit with message like "0.2.0"
4. npm creates git tag like "v0.2.0"

**Cross-Platform Compatibility**: Uses Node.js built-in fs and path modules. Works on Windows, macOS, Linux.

**Current Version Mismatch Note**: Project currently has mismatch (package.json: 0.1.0, manifest.json: 0.2.0). Need to manually sync before implementing version bump workflow.

## 3. Changelog Management (P3 - Nice to Have)

### Approach

**Decision**: Simple CHANGELOG.md file with manual updates, following Keep a Changelog format.

**Rationale**:
- Changelog is P3 (lowest priority)
- Manual changelog allows for human-readable, contextual release notes
- Chrome Web Store requires human-written release notes anyway
- Automatic changelog generation from commits would require conventional commits (adds complexity)

**Format**: Follow https://keepachangelog.com/en/1.0.0/ standard:
- Sections: Added, Changed, Deprecated, Removed, Fixed, Security
- Versions in reverse chronological order
- Link to version tags

**Integration**:
- Developer manually updates CHANGELOG.md before version bump
- Packaging script can extract current version section for Chrome Web Store release notes

**Example Structure**:
```markdown
# Changelog

All notable changes to TweetYoink will be documented in this file.

## [Unreleased]

## [0.2.0] - 2025-11-01
### Added
- Tweet URL capture in metadata
- Original tweet URL for retweets/quotes

### Changed
- Updated API contract to include URL fields

## [0.1.0] - 2025-10-31
### Added
- Initial extension setup
- Tweet capture with overlay response
- Debug information display
```

## 4. Additional Best Practices

### Deterministic ZIP Creation

**Finding**: Not required for Chrome Web Store submission. Chrome Web Store doesn't verify byte-identical builds.

**Recommendation**: Skip deterministic ZIP implementation unless security/verification needs emerge later.

### File Permission Preservation

**Finding**: archiver preserves file permissions by default when using `archive.directory()` or `archive.glob()` with proper options.

**Recommendation**: Ensure Unix permissions are preserved for any executable files (though Chrome extensions typically don't have executables).

### Integration with Existing Build System

**Finding**: Vite with @crxjs/vite-plugin handles all extension bundling and manifest processing.

**Recommendation**:
- Always run production build before packaging (`npm run build`)
- Chain commands in npm script: `"package": "npm run build && tsx scripts/package.ts"`
- Validate manifest.json exists in dist/ before creating ZIP

### Build Artifact Cleanup

**Finding**: Vite may leave .vite/ directory in dist/ with build metadata.

**Recommendation**: Use archiver's `ignore` option to exclude .vite/ from ZIP package.

## 5. Technical Decisions Summary

| Aspect | Decision | Dependencies Added |
|--------|----------|-------------------|
| ZIP Creation | archiver npm package | archiver, @types/archiver |
| Version Management | npm version + custom script | None (uses existing tsx) |
| Changelog | Manual CHANGELOG.md | None |
| Build Integration | npm script chaining | None |
| File Exclusion | archiver glob ignore patterns | None |

**Total New Dependencies**: 2 devDependencies (archiver, @types/archiver)

## 6. Implementation Sequence

Recommended order for implementing features (aligns with P1/P2/P3 priorities):

**Phase 1 (P1 - MVP)**:
1. Add archiver dependencies
2. Create scripts/package.ts
3. Add npm package script
4. Test ZIP creation and Chrome Web Store upload
5. Update .gitignore to exclude releases/

**Phase 2 (P2)**:
1. Create scripts/sync-version.ts
2. Add npm version lifecycle hooks
3. Add version:patch, version:minor, version:major scripts
4. Manually sync current package.json and manifest.json versions
5. Test version bump workflow

**Phase 3 (P3 - Nice to Have)**:
1. Create CHANGELOG.md with initial entries
2. Document changelog workflow in README.md
3. (Optional) Add script to extract current version section for Chrome Web Store

## References

- [archiver documentation](https://www.archiverjs.com/)
- [npm version documentation](https://docs.npmjs.com/cli/v8/commands/npm-version/)
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Semantic Versioning](https://semver.org/)
