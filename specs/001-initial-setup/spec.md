# Feature Specification: Initial Project Setup

**Feature Branch**: `001-initial-setup`
**Created**: 2025-10-23
**Status**: Draft
**Input**: User description: "initial setup, let's set overall project up, so I can even add it into the chrome browser as a dev extension, ask me questions what are not clear"

## Clarifications

### Session 2025-10-23

- Q: Which CI/CD platform should be used for automated builds and testing? → A: GitHub Actions
- Q: Which testing framework should be used? → A: Vitest (with Playwright for E2E testing)
- Q: How should extension icons be generated from the thumbnail? → A: Use automated script (sharp/jimp) to generate all sizes from thumbnail.jpg
- Q: What level of test coverage should the initial setup include? → A: Basic smoke tests for CI/CD validation (build succeeds, manifest valid, TypeScript compiles, extension loads)
- Q: When should the GitHub Actions CI workflow run? → A: On push to any branch + all pull requests
- Q: Where should the source thumbnail be stored? → A: In assets/ or public/assets/ directory (tmp/ is only for truly temporary files, not source assets)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Load Extension in Developer Mode (Priority: P0)

As a developer, I want to load the TweetYoink extension into Chrome as a developer extension so that I can start testing and developing the tweet capture functionality.

**Why this priority**: This is the absolute foundation - without the ability to load the extension in Chrome, no development or testing can proceed. This is a prerequisite for all other features.

**Independent Test**: Can be fully tested by loading the extension in Chrome's developer mode (chrome://extensions) and verifying it appears in the extension list without errors. Delivers the ability to start development.

**Acceptance Scenarios**:

1. **Given** the project repository is cloned, **When** I navigate to chrome://extensions and enable "Developer mode", **Then** I see the "Load unpacked" button
2. **Given** Developer mode is enabled, **When** I click "Load unpacked" and select the extension directory, **Then** the extension loads without errors
3. **Given** the extension is loaded, **When** I view the extensions list, **Then** I see "TweetYoink" with a valid icon and description
4. **Given** the extension is loaded, **When** I open the extension popup, **Then** I see a basic UI (even if just a placeholder)
5. **Given** the extension is loaded, **When** I navigate to twitter.com or x.com, **Then** the content script initializes without console errors

---

### User Story 2 - Build and Reload Extension (Priority: P1)

As a developer, I want to build the extension from TypeScript source and reload it in Chrome so that I can iterate on development with a fast feedback loop.

**Why this priority**: After the initial load works, developers need to be able to make changes and see results quickly. This enables the development workflow.

**Independent Test**: Can be fully tested by modifying a TypeScript file, running the build command, and reloading the extension in Chrome to verify the changes appear. Delivers the ability to iterate on development.

**Acceptance Scenarios**:

1. **Given** TypeScript source files exist, **When** I run the build command, **Then** the extension is compiled without errors
2. **Given** the build completes successfully, **When** I click "Reload" in chrome://extensions, **Then** the updated extension loads with my changes
3. **Given** I make a change to the popup UI, **When** I rebuild and reload, **Then** the popup reflects my changes
4. **Given** I make a change to the content script, **When** I rebuild and reload, **Then** the content script runs with my changes on Twitter/X
5. **Given** a build error occurs, **When** I view the console, **Then** I see clear error messages indicating what failed

---

### User Story 3 - View Extension Logs (Priority: P1)

As a developer, I want to view logs from the extension's background service worker and content script so that I can debug issues and understand what the extension is doing.

**Why this priority**: Debugging is essential for development. Without logs, developers would be working blind when issues occur.

**Independent Test**: Can be fully tested by triggering actions in the extension and verifying that logs appear in the appropriate Chrome DevTools consoles. Delivers the ability to debug.

**Acceptance Scenarios**:

1. **Given** the extension is loaded, **When** I click "service worker" link in chrome://extensions, **Then** the DevTools console opens showing service worker logs
2. **Given** I'm on Twitter/X, **When** I open the page DevTools console, **Then** I see content script logs
3. **Given** the extension performs an action, **When** I check the appropriate console, **Then** I see descriptive log messages
4. **Given** an error occurs, **When** I check the console, **Then** I see error details with stack traces

---

### User Story 4 - CI/CD Pipeline and Automated Testing (Priority: P1)

As a developer, I want an automated CI/CD pipeline that runs tests and validates builds on every push so that I can catch issues early and maintain code quality.

**Why this priority**: Automated testing and CI/CD are essential for maintaining code quality and catching regressions early. This prevents broken code from reaching the main branch and provides confidence when merging changes.

**Independent Test**: Can be fully tested by pushing code to a branch and verifying the GitHub Actions workflow runs, executes tests, and reports results. Delivers automated quality gates.

**Acceptance Scenarios**:

1. **Given** code is pushed to any branch, **When** the push completes, **Then** GitHub Actions workflow is triggered automatically
2. **Given** the CI workflow runs, **When** tests execute, **Then** build succeeds, TypeScript compiles with zero errors, and all tests pass
3. **Given** a pull request is created, **When** CI runs, **Then** PR shows green checkmark if tests pass or red X if tests fail
4. **Given** a test fails, **When** viewing the CI logs, **Then** clear error messages indicate which test failed and why
5. **Given** the extension loads successfully, **When** Playwright E2E test runs, **Then** test verifies extension appears in Chrome without errors

---

### Edge Cases

- What happens when the manifest.json is malformed? (Chrome shows clear error message on load)
- What happens when TypeScript compilation fails? (Build command exits with error and shows error details)
- What happens when the extension is already loaded and I try to load it again? (Chrome shows error indicating extension ID conflict)
- What happens when I navigate to a non-Twitter page? (Content script doesn't inject or injects but does nothing)
- What happens when the build output directory doesn't exist? (Build tool creates it automatically)
- What happens when a test fails in CI? (Workflow fails, PR cannot be merged until fixed, clear logs show failure reason)
- What happens when CI runs on a fork? (Workflow runs but may have limited permissions for security)
- What happens if the source thumbnail is missing? (Icon generation script fails with clear error message indicating the expected location)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Project MUST have a valid Chrome Extension Manifest V3 configuration file
- **FR-002**: Extension MUST be loadable in Chrome via "Load unpacked" developer mode
- **FR-003**: Build system MUST compile TypeScript source files into browser-compatible JavaScript
- **FR-004**: Extension MUST include a popup UI (even if placeholder) accessible via the extension icon
- **FR-005**: Extension MUST include a service worker that initializes without errors
- **FR-006**: Extension MUST include a content script that runs on Twitter/X domains (twitter.com and x.com)
- **FR-007**: Build output MUST be in a dedicated directory (dist/ or build/) separate from source
- **FR-008**: Extension MUST display a name, version, and description in chrome://extensions
- **FR-009**: Extension MUST include icons (16x16, 48x48, 128x128) generated from a source thumbnail
- **FR-009a**: Project MUST include an automated script to generate icon sizes from tmp/thumbnail.jpg using sharp or jimp
- **FR-010**: Developer MUST be able to rebuild the extension after making source changes
- **FR-011**: Developer MUST be able to reload the extension in Chrome to see changes
- **FR-012**: All extension components (service worker, content script, popup) MUST log initialization messages for debugging
- **FR-013**: Project MUST include a GitHub Actions workflow that runs on push to any branch and all pull requests
- **FR-014**: CI pipeline MUST verify TypeScript compilation succeeds with zero errors
- **FR-015**: Project MUST include Vitest configuration for unit testing
- **FR-016**: Project MUST include Playwright configuration for E2E extension testing
- **FR-017**: CI pipeline MUST run both Vitest unit tests and Playwright E2E tests
- **FR-018**: Project MUST include basic smoke tests: build succeeds, manifest.json is valid JSON, TypeScript compiles without errors
- **FR-019**: Project MUST include at least one Playwright test that verifies the extension loads in Chrome without errors

### Assumptions

- **Assumption 1**: Developers have Node.js and npm/yarn installed (standard for modern JavaScript/TypeScript development)
- **Assumption 2**: Developers are using Chrome or a Chromium-based browser (Edge, Brave, Opera)
- **Assumption 3**: The extension will use Vite as the build tool (per constitution's Architecture Standards)
- **Assumption 4**: TypeScript strict mode will be enabled from the start (per constitution's Principle IV)
- **Assumption 5**: The initial setup includes only the minimal structure - no tweet capture functionality yet
- **Assumption 6**: Hot module reload (HMR) is desirable but not required for the initial setup (can be P2 enhancement)

### Key Entities

- **Extension Manifest**: Defines extension metadata, permissions, and entry points (popup, service worker, content scripts)
- **Build Configuration**: Defines how TypeScript is compiled and bundled for the browser
- **Service Worker**: Background script that runs in the extension context (replaces background page in Manifest V3)
- **Content Script**: Script that runs in the context of web pages (Twitter/X in this case)
- **Popup UI**: User interface shown when clicking the extension icon in the Chrome toolbar
- **CI/CD Workflow**: GitHub Actions workflow file (.github/workflows/ci.yml) that automates build, test, and validation
- **Test Configurations**: Vitest config for unit tests, Playwright config for E2E extension testing
- **Icon Generation Script**: Automated script using sharp/jimp to generate icon sizes from source thumbnail

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can load the extension in Chrome developer mode in under 1 minute (from cloning the repo)
- **SC-002**: Extension appears in chrome://extensions with no errors or warnings
- **SC-003**: Developer can make a code change, rebuild, and see the change in Chrome in under 30 seconds
- **SC-004**: All extension components (service worker, content script, popup) initialize and log successfully on first load
- **SC-005**: Extension remains stable when navigating between Twitter/X pages (no crashes or console errors)
- **SC-006**: Developer can view logs from all extension components using Chrome DevTools
- **SC-007**: Build command completes successfully in under 10 seconds for initial compilation
- **SC-008**: Extension structure follows the constitution's defined repository layout (src/types/, src/extractors/, src/content-script.ts, etc.)
- **SC-009**: GitHub Actions workflow runs successfully on push and completes all checks (build, type-check, tests) in under 5 minutes
- **SC-010**: All smoke tests pass: manifest validation, TypeScript compilation, build succeeds, extension loads in Playwright
- **SC-011**: Extension icons (16x16, 48x48, 128x128) are automatically generated from tmp/thumbnail.jpg and display correctly
- **SC-012**: CI workflow badge shows "passing" status on the repository README
