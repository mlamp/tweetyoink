# Feature Specification: Automated Chrome Web Store Publishing

**Feature Branch**: `007-chrome-store-publish`
**Created**: 2025-11-01
**Status**: Draft
**Input**: User description: "I'd like to setup good way to actually publish this extension, seems Chrome Web store accepts 'Drop a ZIP or CRX file here or select a file'. What would be the best way to do it? I want it be rather automatic, at least the packaging/etc."

## User Scenarios & Testing

### User Story 1 - One-Command ZIP Package Creation (Priority: P1) 🎯 MVP

As a developer, I want to create a production-ready ZIP package with a single command, so that I can quickly prepare releases for Chrome Web Store submission without manual file management.

**Why this priority**: This is the core requirement - the ability to package the extension. Without this, manual publishing remains tedious and error-prone. This delivers immediate value by automating the most time-consuming part of the release process.

**Independent Test**: Run the packaging command, verify a valid ZIP file is created in a predictable location, and manually upload it to Chrome Web Store to confirm it's accepted.

**Acceptance Scenarios**:

1. **Given** the extension has been built for production, **When** developer runs the package command, **Then** a ZIP file is created containing only the necessary files for Chrome Web Store
2. **Given** the packaging command succeeds, **When** developer inspects the ZIP file, **Then** it contains manifest.json, all built assets, and excludes source files and development artifacts
3. **Given** a ZIP package has been created, **When** developer uploads it to Chrome Web Store dashboard, **Then** Chrome Web Store accepts the package without errors

---

### User Story 2 - Automated Version Bumping (Priority: P2)

As a developer, I want version numbers to be automatically managed during packaging, so that I don't have to manually update manifest.json and package.json for each release.

**Why this priority**: Version management is error-prone when done manually. Automating this reduces mistakes and ensures consistency across manifest.json and package.json. This builds on P1 to make the release process more robust.

**Independent Test**: Run version bump command with different increment types (patch, minor, major), verify both manifest.json and package.json are updated correctly, and confirm the packaged ZIP reflects the new version.

**Acceptance Scenarios**:

1. **Given** current version is 0.1.0, **When** developer runs patch version bump, **Then** version becomes 0.1.1 in both manifest.json and package.json
2. **Given** current version is 0.1.5, **When** developer runs minor version bump, **Then** version becomes 0.2.0 in both manifest.json and package.json
3. **Given** current version is 0.9.0, **When** developer runs major version bump, **Then** version becomes 1.0.0 in both manifest.json and package.json
4. **Given** version has been bumped, **When** packaging command runs, **Then** the created ZIP filename includes the new version number

---

### User Story 3 - Release Notes and Changelog Management (Priority: P3)

As a developer, I want to maintain a changelog that can be used for Chrome Web Store release notes, so that users can see what's new in each version.

**Why this priority**: While helpful for professional releases, this is nice-to-have rather than essential. The extension can be published without formal changelogs, making this lower priority than core packaging automation.

**Independent Test**: Update changelog with new entries, run packaging command, verify changelog is included in the package and formatted appropriately for Chrome Web Store submission.

**Acceptance Scenarios**:

1. **Given** a CHANGELOG.md file exists with version entries, **When** developer bumps version, **Then** a new changelog entry template is created for the new version
2. **Given** changelog has been updated for current version, **When** packaging command runs, **Then** the current version's changelog is extractable for Chrome Web Store release notes
3. **Given** multiple versions in changelog, **When** developer views the file, **Then** entries are in reverse chronological order (newest first)

---

### Edge Cases

- What happens when packaging is attempted without running a production build first?
- How does the system handle existing ZIP files with the same version number?
- What if manifest.json version doesn't match package.json version before bump?
- How are development-only files (node_modules, src/, .git/, etc.) excluded from the package?
- What happens if Chrome Web Store file size limits (128MB) are exceeded?
- How does packaging handle optional files (icons of different sizes, localization files)?

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a single npm script command to create a production-ready ZIP package
- **FR-002**: Packaging process MUST run a production build before creating the ZIP file
- **FR-003**: ZIP package MUST include only distribution files (dist/, public/, manifest.json, icons, LICENSE, README.md)
- **FR-004**: ZIP package MUST exclude development artifacts (node_modules/, src/, .git/, .specify/, specs/, *.log, .env*, etc.)
- **FR-005**: ZIP filename MUST include extension name and version number (e.g., "tweetyoink-v0.1.0.zip")
- **FR-006**: System MUST validate manifest.json exists and is valid JSON before packaging
- **FR-007**: Packaging process MUST fail with clear error message if production build fails
- **FR-008**: System MUST provide npm script to bump version numbers (patch, minor, major)
- **FR-009**: Version bump MUST update both package.json and public/manifest.json synchronously
- **FR-010**: Version bump MUST follow semantic versioning (MAJOR.MINOR.PATCH)
- **FR-011**: System MUST create ZIP files in a predictable output directory (e.g., releases/ or dist/)
- **FR-012**: Packaging command MUST be runnable on both macOS and Linux (cross-platform)
- **FR-013**: System MUST provide documentation for the complete release workflow
- **FR-014**: ZIP package MUST maintain correct file permissions for executables (if any)
- **FR-015**: Packaging process MUST complete in under 60 seconds for typical extension size

### Key Entities

- **ZIP Package**: Distribution artifact containing all files needed for Chrome Web Store submission, excluding source code and development tools
- **Version Number**: Semantic version identifier (MAJOR.MINOR.PATCH) synchronized across manifest.json and package.json
- **Release Directory**: Dedicated folder for storing packaged ZIP files, organized by version
- **Manifest File**: Chrome extension manifest (public/manifest.json) containing extension metadata and version
- **Exclusion List**: Defined set of files and directories that must not be included in the distribution package

## Success Criteria

### Measurable Outcomes

- **SC-001**: Developer can create a Chrome Web Store-ready package with a single command execution
- **SC-002**: Packaging process completes in under 30 seconds from command execution to ZIP file creation
- **SC-003**: 100% of packaged ZIP files are accepted by Chrome Web Store without validation errors
- **SC-004**: Version bumping updates both manifest.json and package.json in under 2 seconds
- **SC-005**: Zero manual file management required between development completion and Chrome Web Store submission
- **SC-006**: Documentation allows new contributors to create a release package in under 5 minutes
- **SC-007**: Packaging process produces consistent, reproducible artifacts (same code → same ZIP contents)

## Out of Scope

The following are explicitly NOT included in this feature:

- **Automated Chrome Web Store API submission**: Manual upload to Chrome Web Store dashboard is acceptable
- **Automated screenshot/promotional material management**: Developers manually upload screenshots and descriptions
- **Multi-browser packaging**: Focus is Chrome Web Store only (not Firefox, Edge, etc.)
- **Code signing/CRX generation**: Chrome Web Store handles signing server-side
- **Rollback mechanisms**: Version control (git tags) handles rollback needs
- **A/B testing or staged rollouts**: Chrome Web Store provides this functionality
- **Automated update checking**: Chrome Web Store handles update distribution
- **Beta channel management**: Not part of initial release automation

## Assumptions

- Developer has Node.js 18+ and npm installed
- Extension follows standard Chrome Extension Manifest V3 structure
- Production build command (`npm run build:prod`) exists and works correctly
- Git is used for version control (for potential git tag integration)
- Developer has manual access to Chrome Web Store Developer Dashboard
- File size is within Chrome Web Store limits (128MB maximum)
- Developer is familiar with semantic versioning concepts
- Chrome Web Store submission is done by a single developer (no team workflow coordination needed)
- Standard zip utilities are available on the development system
- Extension does not require OS-specific native modules or binaries

## Clarifications

### Questions Requiring User Input

None at this time. All aspects of the feature are well-defined based on standard Chrome Web Store publishing workflows and industry best practices.

## Dependencies

- **Existing Build System**: Requires working `npm run build:prod` command
- **Package.json Scripts**: Build system must support npm script orchestration
- **Manifest V3 Structure**: Assumes public/manifest.json exists and follows Chrome Extension standards
- **File System Access**: Requires ability to read dist/ directory and write to releases/ directory

## Notes

- This feature focuses on **packaging automation** only - Chrome Web Store API integration is intentionally excluded for simplicity
- The manual upload step to Chrome Web Store is acceptable for initial releases
- Future enhancement could add Chrome Web Store API integration for fully automated publishing
- Consider adding git tag creation as part of version bump workflow (optional enhancement)
- ZIP creation should be deterministic (same code produces byte-identical ZIP) for security verification
