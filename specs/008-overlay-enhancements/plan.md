# Implementation Plan: Overlay Title Support and Debug JSON Type

**Branch**: `008-overlay-enhancements` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-overlay-enhancements/spec.md`

## Summary

Enhance the existing overlay response system (Feature 004) to support optional titles on all content types and introduce a new "debug" content type for displaying formatted JSON data. This enables better content organization through titled sections and provides developers with readable structured data inspection capabilities.

**Primary Requirement**: Allow servers to send content items with optional title headers, and add support for debug JSON content type with monospaced formatting

**Technical Approach**: Extend existing ResponseContentItem interface with optional title field, add new "debug" type that accepts JSON objects, and implement rendering logic for titled content blocks and formatted JSON display

## Technical Context

**Language/Version**: TypeScript 5.x (existing project standard)
**Primary Dependencies**: Existing - no new dependencies required
**Storage**: N/A (ephemeral overlay state, no persistence)
**Testing**: Manual validation (no automated tests requested for this feature)
**Target Platform**: Chrome Extension Manifest V3 (existing platform)
**Project Type**: Single-project Chrome extension (extends existing overlay feature)
**Performance Goals**:
- JSON formatting for objects up to 20 levels deep without degradation
- Render 1000+ lines of JSON while maintaining 60fps scrolling
- Title rendering overhead <5ms per content item
**Constraints**:
- Maintain 100% backward compatibility with existing responses
- No horizontal scrolling required for debug JSON on viewports ≥768px
- Debug JSON must be XSS-safe (same protection as text content)
**Scale/Scope**:
- Support up to 50 content items per overlay (existing limit)
- Handle debug JSON up to 50KB (reasonable limit for readability)
- Title length gracefully handled up to 500 characters

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Separation of Concerns ✅
**Status**: PASS
- Feature enhances extension-only overlay display
- API contract changes documented (response format spec)
- Server remains independent (sends enhanced JSON structure)
- No new coupling introduced

### Principle II: LLM-First Data Structure ✅
**Status**: PASS (N/A for this feature)
- Feature focuses on response display, not tweet extraction
- Maintains structured JSON for all content types
- Debug type enhances structured data visibility

### Principle III: User Control & Privacy ✅
**Status**: PASS
- No privacy implications (display-only enhancement)
- User explicitly triggers overlay (existing behavior)
- No new data capture or transmission

### Principle IV: TypeScript-First Development ✅
**Status**: PASS
- All code in TypeScript with strict mode
- Enhanced ResponseContentItem interface with proper types
- Debug content type fully typed (JSON object type)

### Principle V: Defensive DOM Extraction ✅
**Status**: PASS (N/A for this feature)
- Feature only affects overlay rendering, not DOM extraction
- Graceful handling of missing/invalid data maintained

### Principle VI: Logging Discipline ✅
**Status**: PASS
- Use existing logger wrapper for debugging
- JSON formatting errors logged via logger.warn()
- Production logs only errors/warnings per discipline

**Constitution Compliance**: All applicable principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/008-overlay-enhancements/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Technical research (Phase 0)
├── data-model.md        # Enhanced ResponseContentItem schema (Phase 1)
├── contracts/           # Updated API contract YAML (Phase 1)
│   └── response-format-v1.2.yaml  # Extended with title field and debug type
├── quickstart.md        # Developer guide for using titles and debug type (Phase 1)
├── checklists/
│   └── requirements.md  # Specification quality checklist (complete)
└── tasks.md             # Implementation task breakdown (Phase 2 - /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── overlay.ts       # MODIFIED: Extend ResponseContentItem with title field
│                        #           Add DebugContentItem type for JSON content
│                        #           Add type guards for debug content
├── ui/
│   ├── overlay-renderer.ts  # MODIFIED: Add title rendering logic
│   │                        #           Add debug JSON formatting logic
│   │                        #           Handle both titled and untitled content
│   └── overlay.css      # MODIFIED: Add title block styles
│                        #           Add monospaced debug content styles
│                        #           Ensure responsive layout for titles
└── utils/
    └── logger.ts        # EXISTING: Used for error logging

specs/004-response-overlay/contracts/
└── response-format.yaml  # REFERENCE: Extended in this feature (v1.1.0 → v1.2.0)
```

**Structure Decision**: Single-project structure maintained. This feature enhances existing overlay system (Feature 004) by extending type definitions and rendering logic. No new modules or architectural components required - only enhancements to existing files.

**File Modification Strategy**:
1. **src/types/overlay.ts**: Add optional `title?: string` field to ResponseContentItem interface, add new "debug" type support, create DebugContentItem interface
2. **src/ui/overlay-renderer.ts**: Add renderTitle() function, add renderDebugContent() function for JSON formatting, update renderContentItem() to handle both
3. **src/ui/overlay.css**: Add `.overlay-item-title` class with bold/distinct styling, add `.overlay-debug-content` class with monospace font and 2-space indentation, ensure mobile responsiveness

**Backward Compatibility Strategy**: All changes are additive - existing ResponseContentItem structure remains valid. Title field is optional, debug type is new alongside existing types (text, image). No breaking changes to API contract.

## Complexity Tracking

> No violations requiring justification - feature aligns with all constitutional principles.

---

*Phases 0-2 will be filled during `/speckit.plan` execution*
