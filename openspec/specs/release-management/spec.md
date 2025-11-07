# Release Management Capability

## Purpose

This capability enables automated packaging and version management for Chrome Web Store releases.

## Requirements

### Requirement: One-Command Package Creation

The system SHALL provide a single npm script command to create a production-ready ZIP package.

#### Scenario: Create package with single command
- **WHEN** developer runs the packaging command
- **THEN** a ZIP file is created containing all necessary files for Chrome Web Store

#### Scenario: Package contains only distribution files
- **WHEN** developer inspects the created ZIP file
- **THEN** it contains manifest.json, built assets, and excludes source files and development artifacts

#### Scenario: Chrome Web Store accepts package
- **WHEN** developer uploads the ZIP to Chrome Web Store dashboard
- **THEN** Chrome Web Store accepts the package without validation errors

### Requirement: Pre-Packaging Production Build

The packaging process MUST run a production build before creating the ZIP file.

#### Scenario: Automatic production build
- **WHEN** packaging command is executed
- **THEN** production build runs automatically before ZIP creation

#### Scenario: Fail on build error
- **WHEN** production build fails during packaging
- **THEN** packaging process stops with clear error message and no ZIP is created

### Requirement: Distribution Files Inclusion

ZIP package SHALL include only distribution files (dist/, public/, manifest.json, icons, LICENSE, README.md).

#### Scenario: Include required files
- **WHEN** ZIP package is created
- **THEN** it contains dist directory, manifest.json, icons, and documentation files

### Requirement: Development Artifact Exclusion

ZIP package MUST exclude development artifacts (node_modules/, src/, .git/, .specify/, specs/, *.log, .env*).

#### Scenario: Exclude source and tooling
- **WHEN** ZIP package is created
- **THEN** no development files (source code, node_modules, git files) are included

### Requirement: Versioned ZIP Filename

ZIP filename SHALL include extension name and version number (e.g., "tweetyoink-v0.1.0.zip").

#### Scenario: Filename includes version
- **WHEN** packaging creates ZIP file
- **THEN** filename follows pattern {name}-v{version}.zip

### Requirement: Manifest Validation

The system MUST validate manifest.json exists and is valid JSON before packaging.

#### Scenario: Validate manifest before packaging
- **WHEN** packaging process begins
- **THEN** manifest.json is validated for existence and JSON validity

#### Scenario: Fail on invalid manifest
- **WHEN** manifest.json is missing or invalid JSON
- **THEN** packaging fails with clear error message

### Requirement: Version Bump Commands

The system SHALL provide npm scripts to bump version numbers (patch, minor, major).

#### Scenario: Patch version bump
- **WHEN** developer runs patch version bump with current version 0.1.0
- **THEN** version becomes 0.1.1 in both manifest.json and package.json

#### Scenario: Minor version bump
- **WHEN** developer runs minor version bump with current version 0.1.5
- **THEN** version becomes 0.2.0 in both manifest.json and package.json

#### Scenario: Major version bump
- **WHEN** developer runs major version bump with current version 0.9.0
- **THEN** version becomes 1.0.0 in both manifest.json and package.json

### Requirement: Synchronized Version Updates

Version bump MUST update both package.json and public/manifest.json synchronously.

#### Scenario: Update both files atomically
- **WHEN** version bump command executes
- **THEN** both package.json and manifest.json are updated to same version number

#### Scenario: Fail if files out of sync
- **WHEN** manifest.json and package.json have different versions before bump
- **THEN** system warns developer and prompts for conflict resolution

### Requirement: Semantic Versioning Compliance

Version bump SHALL follow semantic versioning (MAJOR.MINOR.PATCH) rules.

#### Scenario: Semantic version format
- **WHEN** any version bump occurs
- **THEN** resulting version follows MAJOR.MINOR.PATCH format

### Requirement: Predictable Output Directory

The system MUST create ZIP files in a predictable output directory (e.g., releases/ or dist/).

#### Scenario: Consistent output location
- **WHEN** packaging command completes
- **THEN** ZIP file is created in releases/ directory

### Requirement: Cross-Platform Compatibility

Packaging command SHALL be runnable on both macOS and Linux.

#### Scenario: Run on macOS
- **WHEN** packaging command is executed on macOS
- **THEN** ZIP package is created successfully

#### Scenario: Run on Linux
- **WHEN** packaging command is executed on Linux
- **THEN** ZIP package is created successfully

### Requirement: Release Workflow Documentation

The system MUST provide documentation for the complete release workflow.

#### Scenario: New contributor can create release
- **WHEN** new contributor follows documentation
- **THEN** they can create a release package in under 5 minutes

### Requirement: File Permission Preservation

ZIP package SHALL maintain correct file permissions for executables (if any).

#### Scenario: Preserve executable permissions
- **WHEN** package contains executable files
- **THEN** file permissions are preserved in ZIP

### Requirement: Packaging Performance

Packaging process MUST complete in under 60 seconds for typical extension size.

#### Scenario: Fast packaging
- **WHEN** packaging command runs for typical extension
- **THEN** ZIP creation completes in under 30 seconds

### Requirement: Reproducible Builds

Packaging process SHALL produce consistent, reproducible artifacts.

#### Scenario: Same code produces same package
- **WHEN** same codebase is packaged multiple times
- **THEN** ZIP contents are identical (byte-for-byte when possible)

### Requirement: Version in Package Filename

ZIP filename MUST reflect the version from bumped manifest.

#### Scenario: Updated version in filename
- **WHEN** version has been bumped and packaging runs
- **THEN** ZIP filename includes the new version number

### Requirement: Existing Package Handling

The system MUST handle existing ZIP files with the same version number.

#### Scenario: Overwrite existing package
- **WHEN** ZIP with same version already exists
- **THEN** system prompts for confirmation before overwriting

### Requirement: File Size Validation

The system SHALL validate that package size is within Chrome Web Store limits (128MB).

#### Scenario: Warn on large package
- **WHEN** package exceeds reasonable size (e.g., 100MB)
- **THEN** system warns developer that Chrome Web Store limit is approaching

#### Scenario: Fail on excessive size
- **WHEN** package would exceed 128MB Chrome Web Store limit
- **THEN** packaging fails with clear error message

### Requirement: Changelog Support

The system SHALL support changelog management for release notes.

#### Scenario: Generate changelog entry template
- **WHEN** version bump occurs
- **THEN** new changelog entry template is created for the new version

#### Scenario: Include changelog in package
- **WHEN** CHANGELOG.md exists
- **THEN** it is included in the ZIP package

#### Scenario: Reverse chronological order
- **WHEN** multiple versions exist in changelog
- **THEN** entries are ordered newest first
