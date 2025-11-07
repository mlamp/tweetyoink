# Implementation Plan: Automated Chrome Web Store Publishing

**Branch**: `007-chrome-store-publish` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-chrome-store-publish/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature automates the Chrome Web Store publishing workflow by implementing:
1. **One-command ZIP packaging** (P1/MVP): Single npm script to create production-ready packages with proper file exclusions
2. **Automated version management** (P2): Synchronized version bumping across manifest.json and package.json
3. **Release documentation** (P3): Changelog integration for Chrome Web Store release notes

The approach uses npm scripts to orchestrate production builds, file archiving, and version management while maintaining cross-platform compatibility (macOS/Linux).

## Technical Context

**Language/Version**: TypeScript 5.3 (existing project standard), Node.js 18+ for scripts
**Primary Dependencies**:
- Build: Vite 5.x (existing build tool)
- Archiving: archiver npm package (14.2M weekly downloads, industry standard)
- Version management: npm version built-in command with custom TypeScript sync script
**Storage**: File system (releases/ directory for ZIP artifacts, package.json and public/manifest.json for version state)
**Testing**: Manual validation (upload to Chrome Web Store dashboard), no automated tests for packaging
**Target Platform**: Developer workstations (macOS/Linux - cross-platform requirement from FR-012)
**Project Type**: Build tooling extension for existing Chrome Extension project
**Performance Goals**:
- Packaging completes in <30 seconds (SC-002)
- Version bump completes in <2 seconds (SC-004)
**Constraints**:
- Cross-platform (macOS/Linux shell compatibility)
- Chrome Web Store file size limit (128MB max)
- No Windows support required (per assumptions)
- Must integrate with existing Vite build system
**Scale/Scope**:
- Single-developer workflow
- ~10-20 releases per year expected
- Extension size ~5-10MB (dist/ folder currently)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Separation of Concerns
✅ **PASS** - This feature adds build tooling to the extension repository only. No server-side changes. Backend URL configuration remains independent.

### Principle II: LLM-First Data Structure
✅ **N/A** - This feature does not involve tweet extraction or data capture. No impact.

### Principle III: User Control & Privacy
✅ **N/A** - This feature does not involve user data collection or capture. No impact on privacy.

### Principle IV: TypeScript-First Development
✅ **PASS** - Any TypeScript scripts will use strict mode. Bash scripts acceptable for build tooling. Version management scripts may use Node.js with TypeScript if needed.

### Principle V: Defensive DOM Extraction
✅ **N/A** - This feature does not involve DOM extraction. No impact.

### Principle VI: Logging Discipline
✅ **PASS** - Build scripts may use `console.*` directly (explicitly allowed exception in constitution). No application code logging involved.

### Architecture Standards Compliance
✅ **PASS** - Feature documentation will be placed in `specs/007-chrome-store-publish/` per constitution guidelines.

**GATE STATUS**: ✅ **ALL CHECKS PASSED** - Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
tweetyoink/                    # Repository root
├── scripts/                   # Build and release automation scripts
│   ├── package.ts            # ZIP packaging script (NEW)
│   ├── bump-version.ts       # Version management script (NEW)
│   └── generate-icons.ts     # Existing icon generation
├── releases/                  # ZIP output directory (NEW, gitignored)
│   └── tweetyoink-v*.zip     # Versioned release packages
├── dist/                      # Vite build output (existing)
│   ├── manifest.json         # Processed from public/
│   ├── assets/               # Bundled JS/CSS
│   └── icons/                # Extension icons
├── public/                    # Static extension assets (existing)
│   ├── manifest.json         # Source manifest with version
│   └── icons/                # Icon source files
├── src/                       # Extension source code (existing, unchanged)
├── package.json              # NPM package with version (MODIFIED)
├── CHANGELOG.md              # Version history and release notes (NEW)
└── .gitignore                # Updated to exclude releases/

# Files included in ZIP package (FR-003):
# - dist/ (entire directory - all built assets)
# - public/manifest.json (manifest)
# - public/icons/ (all icon sizes)
# - LICENSE
# - README.md

# Files excluded from ZIP package (FR-004):
# - node_modules/, src/, .git/, .specify/, specs/
# - scripts/, releases/, *.log, .env*, .gitignore, etc.
```

**Structure Decision**:
- **Single project structure** (Option 1 variant) - This is a Chrome Extension with build tooling
- New `scripts/` directory contains TypeScript build automation
- New `releases/` directory (gitignored) stores generated ZIP files
- Existing `dist/` contains the built extension
- Version managed synchronously in both `package.json` and `public/manifest.json`

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - Constitution Check passed without issues. This feature adds build tooling that aligns with existing project structure and principles.

---

## Post-Design Constitution Re-evaluation

**Date**: 2025-11-01 (after Phase 1 design completion)

### Principle I: Separation of Concerns
✅ **PASS** - Design adds build scripts to extension repository only. No server-side changes. Backend configuration remains independent.

### Principle II: LLM-First Data Structure
✅ **N/A** - Build tooling does not affect tweet extraction or data capture.

### Principle III: User Control & Privacy
✅ **N/A** - Build tooling does not involve user data.

### Principle IV: TypeScript-First Development
✅ **PASS** - scripts/package.ts and scripts/sync-version.ts use TypeScript with strict mode. Aligns with existing scripts/generate-icons.ts pattern.

### Principle V: Defensive DOM Extraction
✅ **N/A** - Build tooling does not involve DOM extraction.

### Principle VI: Logging Discipline
✅ **PASS** - Build scripts use console.* directly (explicitly allowed exception). No application code logging.

### Architecture Standards Compliance
✅ **PASS** - All documentation in specs/007-chrome-store-publish/ per guidelines. Scripts in scripts/ directory matching existing pattern.

### New Dependencies Impact
- **archiver** (14.2M weekly downloads): Industry standard, actively maintained, no security concerns
- **@types/archiver**: TypeScript definitions, no runtime impact

**FINAL GATE STATUS**: ✅ **ALL CHECKS PASSED** - Design approved, ready for task breakdown.
