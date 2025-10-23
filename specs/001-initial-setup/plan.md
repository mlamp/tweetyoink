# Implementation Plan: Initial Project Setup

**Branch**: `001-initial-setup` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-initial-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Set up the TweetYoink Chrome extension project with a complete development environment including TypeScript build system (Vite), CI/CD pipeline (GitHub Actions), automated testing (Vitest + Playwright), and asset generation. The extension must be loadable in Chrome developer mode with all components (service worker, content script, popup) initializing successfully. Includes automated icon generation from source thumbnail and comprehensive smoke tests for quality gates.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Vite 5.x, @crxjs/vite-plugin (Chrome extension Vite plugin), @types/chrome (TypeScript definitions for Chrome APIs), Vitest (unit testing), Playwright (E2E testing), sharp or jimp (icon generation)
**Storage**: Chrome Storage API (for extension settings), no external database
**Testing**: Vitest for unit/smoke tests, Playwright for E2E extension testing, basic smoke test coverage (manifest validation, TypeScript compilation, build success, extension loads)
**Target Platform**: Chrome/Chromium browsers (Chrome, Edge, Brave, Opera)
**Project Type**: Single project (Chrome extension)
**Performance Goals**: Build completes in <10 seconds, extension loads in <1 second, CI pipeline completes in <5 minutes
**Constraints**: Must work in Chrome developer mode, must follow Manifest V3 requirements, TypeScript strict mode required, GitHub Actions free tier limits
**Scale/Scope**: Minimal project structure for local development only (no production deployment yet), ~20 source files, basic test coverage for initial setup

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Separation of Concerns
✅ **PASS** - This feature sets up the extension repository only. No backend code is included.

### Principle II: LLM-First Data Structure
✅ **PASS** - Not applicable for initial setup. Future features will implement DOM parsing.

### Principle III: User Control & Privacy
✅ **PASS** - No data capture functionality in initial setup. Settings infrastructure will be prepared for future configuration.

### Principle IV: TypeScript-First Development
✅ **PASS** - TypeScript 5.x with strict mode will be configured from the start. All source files will be .ts/.tsx.

### Principle V: Defensive DOM Extraction
✅ **PASS** - Not applicable for initial setup. Future features will implement defensive extraction patterns.

### Architecture Standards: Technology Stack
✅ **PASS** - Using TypeScript 5.x, Vite with @crxjs/vite-plugin, Manifest V3, Vitest + Playwright for testing. Matches constitution requirements exactly.

### Architecture Standards: Repository Structure
✅ **PASS** - Will create the exact structure defined in constitution:
```
src/
├── types/
├── extractors/
├── content-script.ts
├── service-worker.ts
└── popup/

tests/
├── smoke/           # Basic smoke tests
└── e2e/             # Playwright E2E tests
```

### Development Workflow: Quality Gates
✅ **PASS** - CI/CD pipeline with GitHub Actions, TypeScript compilation with zero errors, Vitest + Playwright tests, no tests required for initial setup beyond smoke tests (per constitution: testing is optional but we're including basic smoke tests for CI validation).

**Result**: All constitutional requirements satisfied. Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-initial-setup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── checklists/          # Quality validation checklists
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
tweetyoink/
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── extractors/
│   │   └── .gitkeep              # Placeholder for future extractors
│   ├── popup/
│   │   ├── popup.html            # Popup UI HTML
│   │   ├── popup.ts              # Popup TypeScript logic
│   │   └── popup.css             # Popup styles
│   ├── content-script.ts         # Content script for Twitter/X pages
│   └── service-worker.ts         # Background service worker
├── public/
│   ├── icons/
│   │   ├── icon-16.png           # Extension icon 16x16
│   │   ├── icon-48.png           # Extension icon 48x48
│   │   └── icon-128.png          # Extension icon 128x128
│   └── manifest.json             # Chrome Extension Manifest V3
├── tests/
│   ├── smoke/
│   │   └── manifest.test.ts      # Manifest validation tests
│   └── e2e/
│       └── extension-load.spec.ts # Playwright extension load test
├── scripts/
│   └── generate-icons.ts         # Icon generation from thumbnail
├── tmp/
│   └── thumbnail.jpg             # Source thumbnail for icon generation
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI workflow
├── dist/                         # Build output (generated by Vite)
├── node_modules/                 # Dependencies (generated by npm)
├── package.json                  # Node.js dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Vitest test configuration
├── playwright.config.ts          # Playwright E2E configuration
├── .gitignore                    # Git exclusion patterns
└── README.md                     # Project documentation
```

**Structure Decision**: Single project structure (Chrome extension). All source code in `src/`, build output in `dist/`, tests in `tests/` with separation between smoke tests and E2E tests. CI/CD configuration in `.github/workflows/`, asset generation scripts in `scripts/`, source assets in `tmp/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - All constitutional requirements are satisfied.
