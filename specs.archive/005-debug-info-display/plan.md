# Implementation Plan: Debug Metadata Display in Overlay UI

**Branch**: `005-debug-info-display` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-debug-info-display/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature extends the existing overlay infrastructure (Feature 004) to display structured debug metadata from server responses during development. Debug blocks will be detected via the `metadata.is_debug` flag, rendered with collapsible sections using native HTML `<details>/<summary>` elements, and shown only in development mode using Vite's `import.meta.env.DEV` check. The implementation uses built-in JSON parsing with try-catch error handling and extends the existing `overlay-renderer.ts` with a new `renderDebugBlock` function, requiring no new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode
**Primary Dependencies**: Vite (build tool), vite-plugin-web-extension, Chrome Extension Manifest V3
**Storage**: N/A (UI-only feature)
**Testing**: Not required for this feature (manual verification sufficient)
**Target Platform**: Chrome Extension (Manifest V3, desktop browsers)
**Project Type**: Single (Chrome extension with content scripts)
**Performance Goals**: Debug block rendering <100ms, handle up to 100KB JSON without UI freezing
**Constraints**: Development-only feature (zero production footprint), no new dependencies, extend existing overlay infrastructure
**Scale/Scope**: Single Chrome extension, 4 debug sections (orchestrator decisions, agent analyses, execution metrics, request metadata)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I: Separation of Concerns**
Status: PASS - Feature is extension-only, no backend changes required. Backend already generates debug blocks with `is_debug` flag.

**Principle II: LLM-First Data Structure**
Status: N/A - Feature renders existing server data, does not modify extraction logic.

**Principle III: User Control & Privacy**
Status: PASS - Debug info shown only in development mode, never in production. Uses environment detection to prevent accidental exposure.

**Principle IV: TypeScript-First Development**
Status: PASS - All code will be TypeScript with strict mode. Interfaces defined for DebugContentItem, DebugData, CollapsibleSection state.

**Principle V: Defensive DOM Extraction**
Status: N/A - Feature renders data to overlay, does not extract from Twitter DOM.

**Principle VI: Logging Discipline**
Status: PASS - Debug rendering will use `logger.debug()` and `logger.warn()` for malformed JSON. Aligns with development-focused logging strategy.

**Overall Status**: PASS - No constitution violations. Feature is a clean extension of existing overlay infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/005-debug-info-display/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── debug-block-format.yaml
├── checklists/          # Quality validation checklists
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── overlay.ts       # MODIFY: Add DebugContentItem, DebugData interfaces
├── ui/
│   ├── overlay-renderer.ts   # MODIFY: Add renderDebugBlock() function
│   ├── overlay-manager.ts    # No changes needed (lifecycle management)
│   └── overlay.css           # MODIFY: Add debug block styling
├── services/
│   └── response-handler.ts   # MODIFY: Add debug block detection logic
└── utils/
    └── logger.ts             # REUSE: Existing logger for debug/warn messages
```

**Structure Decision**: This is a Chrome extension using the single project structure. All TypeScript source lives in `src/` with organized subdirectories for types, UI components, services, and utilities. The feature extends existing overlay infrastructure from Feature 004 by adding debug-specific rendering logic. No new directories or files are created - only modifications to existing modules.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. This section intentionally left empty.
