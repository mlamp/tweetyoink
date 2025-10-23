# Research: Initial Project Setup

**Feature**: 001-initial-setup
**Date**: 2025-10-23
**Phase**: Phase 0 - Technical Research

## Overview

This document captures research decisions for setting up the TweetYoink Chrome extension project with TypeScript, Vite, and Manifest V3.

---

## Decision 1: Build Tool Selection

### Decision
Use **Vite 5.x with @crxjs/vite-plugin** as the build tool for the Chrome extension.

### Rationale
1. **Constitutional Requirement**: Constitution explicitly mandates "Vite with vite-plugin-web-extension"
2. **Fast Build Times**: Vite uses esbuild for pre-bundling, achieving <10 second build times (per success criteria SC-007)
3. **TypeScript Support**: First-class TypeScript support with no additional configuration needed
4. **Chrome Extension Support**: @crxjs/vite-plugin provides Manifest V3 support with automatic HMR for extension development
5. **Modern DX**: Hot Module Replacement (HMR) works for popup and content scripts during development

### Alternatives Considered
- **webpack**: More mature ecosystem but significantly slower build times (30+ seconds for initial builds)
- **Rollup**: Good for libraries but lacks the DX features of Vite for extension development
- **Parcel**: Simpler but less control and no dedicated Chrome extension plugin

### Implementation Details
```json
// package.json dependencies
{
  "vite": "^5.0.0",
  "@crxjs/vite-plugin": "^2.0.0-beta.21",
  "typescript": "^5.3.0"
}
```

---

## Decision 2: TypeScript Configuration

### Decision
Enable **strict mode** with all strict type checking options enabled from the start.

### Rationale
1. **Constitutional Requirement**: Principle IV mandates "TypeScript with strict type checking" and "`strict: true` in tsconfig.json"
2. **Early Error Detection**: Catch type errors at compile time rather than runtime
3. **Better Refactoring**: Strong types make refactoring safer as the codebase grows
4. **Chrome API Safety**: @types/chrome provides excellent type definitions that work best with strict mode

### Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Alternatives Considered
- **Loose TypeScript**: Rejected because constitution explicitly requires strict mode
- **JavaScript with JSDoc**: Rejected because TypeScript provides better tooling and compile-time guarantees

---

## Decision 3: Manifest V3 Structure

### Decision
Use **Manifest V3 with service worker** instead of Manifest V2 with background page.

### Rationale
1. **Constitutional Requirement**: Constitution mandates "Manifest V3 (service worker architecture)"
2. **Chrome Requirement**: Manifest V2 is deprecated and will be removed from Chrome Web Store in 2024
3. **Security Model**: Service workers provide better isolation and security than persistent background pages
4. **Resource Efficiency**: Service workers are event-driven and don't run continuously, saving memory

### Manifest Structure
```json
{
  "manifest_version": 3,
  "name": "TweetYoink",
  "version": "0.1.0",
  "description": "Capture tweets from Twitter/X for LLM analysis",
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://twitter.com/*",
    "https://x.com/*"
  ],
  "background": {
    "service_worker": "src/service-worker.ts",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["https://twitter.com/*", "https://x.com/*"],
    "js": ["src/content-script.ts"]
  }],
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  }
}
```

### Key Permissions
- **storage**: For saving extension settings (backend URL, API key)
- **activeTab**: For content script to access current Twitter/X tab
- **host_permissions**: Required for content scripts on twitter.com and x.com

---

## Decision 4: Content Script Injection Strategy

### Decision
Use **declarative content script injection** defined in manifest.json for Twitter/X pages.

### Rationale
1. **Automatic Injection**: Content script automatically loads when user visits Twitter/X
2. **Manifest V3 Best Practice**: Declarative content scripts are preferred over programmatic injection
3. **Performance**: Content script loads as soon as DOM is ready, no permission prompts needed
4. **Simplicity**: No need for complex injection logic in service worker

### Implementation
- Content script runs on `https://twitter.com/*` and `https://x.com/*`
- Script executes after DOM is loaded but before page finish loading
- Minimal initialization code logs to console for debugging (per FR-012)

### Alternatives Considered
- **Programmatic Injection**: More complex, requires additional permissions, harder to debug
- **Inject on Click**: Would require user to click before content script is available (poor UX)

---

## Decision 5: Icon Asset Strategy

### Decision
Generate icons **automatically from thumbnail** using Sharp library.

### Rationale
1. **Automation**: Automated generation ensures consistency across all icon sizes
2. **Source Control**: `tmp/thumbnail.jpg` provides single source of truth for icon design
3. **Easy Updates**: Re-running script regenerates all sizes if thumbnail changes
4. **Professional**: Sharp library provides high-quality image resizing

### Icon Sizes
- **16x16**: Extension toolbar icon (normal density)
- **48x48**: Extension management page
- **128x128**: Chrome Web Store (future) and extension installation

### Implementation Approach
Use Sharp library to generate PNG icons from `tmp/thumbnail.jpg`:

```typescript
// scripts/generate-icons.ts
import sharp from 'sharp';
import path from 'path';

const sizes = [16, 48, 128];
const source = 'tmp/thumbnail.jpg';
const outputDir = 'public/icons';

for (const size of sizes) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(path.join(outputDir, `icon-${size}.png`));
}
```

### Error Handling
- Check if `tmp/thumbnail.jpg` exists before running
- Exit with clear error message if source missing
- Validate output directory exists

### Alternatives Considered
- **Manual creation**: Time-consuming, inconsistent results across sizes
- **Jimp library**: Pure JavaScript but 10-20x slower than Sharp
- **ImageMagick**: Requires system installation, not portable

---

## Decision 6: CI/CD Platform

### Decision
Use **GitHub Actions** for continuous integration and deployment.

### Rationale
1. **Native Integration**: Seamless integration with GitHub repository
2. **Cost**: Free for public repositories (2,000 minutes/month)
3. **YAML Configuration**: Simple declarative workflow files
4. **Status Badges**: Native support for README badges
5. **Community**: Large ecosystem of actions and examples

### Workflow Configuration
File: `.github/workflows/ci.yml`

Triggers:
- On push to any branch
- On all pull requests

Jobs:
1. Install dependencies
2. Run type checking (`npm run type-check`)
3. Generate icons (`npm run generate-icons`)
4. Build extension (`npm run build`)
5. Run Vitest tests (`npm run test`)
6. Run Playwright E2E tests (`npm run test:e2e`)

### Performance Target
- Complete all checks in <5 minutes (SC-009)
- Cache `node_modules` to speed up workflow

### Alternatives Considered
- **GitLab CI**: Would require moving repository
- **CircleCI**: Costs money after free tier
- **Jenkins**: Requires self-hosted infrastructure

---

## Decision 7: Unit Testing Framework

### Decision
Use **Vitest** for unit and smoke tests.

### Rationale
1. **Vite Integration**: Native Vite integration, shares build configuration
2. **Performance**: Very fast test execution using esbuild
3. **Jest-Compatible API**: Familiar API for developers
4. **TypeScript Support**: First-class TypeScript support
5. **Watch Mode**: Built-in watch mode for TDD workflow

### Test Configuration
File: `vitest.config.ts`

Test Location: `tests/smoke/*.test.ts`

Smoke Tests:
- Manifest JSON validation (valid JSON, required fields)
- TypeScript compilation check
- Build output verification

Commands:
- `npm run test` - Run tests once
- `npm run test:watch` - Watch mode for development

### Coverage Scope
Basic smoke tests only for initial setup (per clarification). Future features will add comprehensive unit tests.

### Alternatives Considered
- **Jest**: Most popular but slower with Vite, requires additional configuration
- **Mocha + Chai**: Requires more setup, less integrated

---

## Decision 8: E2E Testing Framework

### Decision
Use **Playwright** for end-to-end Chrome extension testing.

### Rationale
1. **Chrome Extension Support**: Excellent support for loading unpacked extensions
2. **Modern Architecture**: Automatic waiting, better than Selenium
3. **TypeScript Support**: First-class TypeScript support
4. **Cross-Browser**: Can test Chrome, Edge, and other Chromium browsers
5. **Developer Experience**: Great debugging tools, trace viewer

### Test Configuration
File: `playwright.config.ts`

Test Location: `tests/e2e/*.spec.ts`

E2E Tests:
- Extension loads without errors
- Service worker initializes
- Popup opens successfully
- Content script loads on Twitter/X

Extension Loading Pattern:
```typescript
const extensionPath = path.join(__dirname, '../../dist');
const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
});
```

Commands:
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:debug` - Run with debugging UI

### Alternatives Considered
- **Puppeteer**: Less extension-focused
- **Selenium**: Older, flakier tests

---

## Decision 9: Development Workflow

### Decision
Use **npm scripts** for build, watch, dev, test, and icon generation commands.

### Rationale
1. **Standard Practice**: npm scripts are the standard way to run build tools in Node.js projects
2. **Simplicity**: No need for additional task runners like Gulp or Grunt
3. **Vite Integration**: Vite provides built-in commands that work well with npm scripts
4. **Clear Commands**: `npm run build`, `npm run dev`, `npm run watch` are intuitive

### Scripts Configuration
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "watch": "vite build --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:debug": "playwright test --debug",
    "generate-icons": "tsx scripts/generate-icons.ts"
  }
}
```

### Workflow
1. **Development**: `npm run dev` - Starts Vite dev server with HMR
2. **Build**: `npm run build` - Builds extension to `dist/` directory
3. **Watch**: `npm run watch` - Rebuilds on file changes
4. **Type Check**: `npm run type-check` - Validates TypeScript without building
5. **Test**: `npm run test` - Run Vitest unit/smoke tests
6. **Test E2E**: `npm run test:e2e` - Run Playwright E2E tests
7. **Generate Icons**: `npm run generate-icons` - Generate icons from thumbnail

---

## Decision 10: Logging Strategy

### Decision
Use **console.log with prefixes** for all logging in initial setup.

### Rationale
1. **Simplicity**: No need for logging library in initial setup
2. **Debugging**: Satisfies FR-012 requirement for initialization logging
3. **Chrome DevTools**: Chrome DevTools console is excellent for viewing extension logs
4. **Future Enhancement**: Can introduce structured logging library later if needed

### Logging Pattern
```typescript
// Service worker
console.log('[TweetYoink Service Worker] Initialized');

// Content script
console.log('[TweetYoink Content Script] Loaded on', window.location.href);

// Popup
console.log('[TweetYoink Popup] Opened');
```

### Log Locations
- **Service Worker**: Visible via "service worker" link in chrome://extensions
- **Content Script**: Visible in page DevTools console
- **Popup**: Visible in popup DevTools console (right-click popup → Inspect)

---

## Decision 11: Initial Directory Structure

### Decision
Create **minimal file structure** with placeholder content for all required components.

### Rationale
1. **Constitutional Compliance**: Follows the exact structure defined in constitution
2. **Completeness**: All components (service worker, content script, popup) present from start
3. **Extensibility**: Structure supports adding extractors, types, and other modules later
4. **Validation**: Satisfies all acceptance scenarios in user stories

### File Contents
- **service-worker.ts**: Basic initialization with console log
- **content-script.ts**: Basic initialization with domain check and console log
- **popup.html/ts/css**: Simple placeholder UI with "TweetYoink" heading
- **types/index.ts**: Empty file, ready for future type definitions
- **extractors/.gitkeep**: Placeholder for future extraction logic

---

## Decision 12: Dependency Management

### Decision
Use **npm** (not yarn or pnpm) for package management.

### Rationale
1. **Universal Support**: npm is included with Node.js, no additional installation
2. **Standard Practice**: Most Chrome extension examples and tutorials use npm
3. **Lock File**: package-lock.json provides reproducible builds
4. **Simplicity**: One less tool for developers to install

### Key Dependencies
```json
{
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta.21",
    "@types/chrome": "^0.0.254",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "latest",
    "playwright": "latest",
    "@playwright/test": "latest",
    "sharp": "latest",
    "tsx": "latest"
  }
}
```

### Alternatives Considered
- **yarn**: Faster but requires separate installation
- **pnpm**: More disk-efficient but less common in extension development

---

## Decision 13: Git Configuration

### Decision
Include **.gitignore** from the start with standard Node.js and Vite exclusions.

### Rationale
1. **Best Practice**: Prevent committing generated files and dependencies
2. **Build Output**: Exclude `dist/` directory (generated by Vite)
3. **Dependencies**: Exclude `node_modules/` (installed via npm)
4. **IDE Files**: Exclude common editor/IDE configuration files

### .gitignore Contents
```
# Dependencies
node_modules/

# Build output
dist/
*.crx
*.pem

# Temporary files
tmp/
*.tmp

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo

# Environment
.env
.env.local

# MCP
.mcp.json

# Tests
playwright-report/
test-results/
coverage/

# Logs
*.log
npm-debug.log*
```

**Note**: `tmp/thumbnail.jpg` should be committed (use `!tmp/thumbnail.jpg` exception if needed)

---

## Summary of Technical Decisions

| Decision | Choice | Constitutional Alignment |
|----------|--------|-------------------------|
| Build Tool | Vite 5.x + @crxjs/vite-plugin | ✅ Mandated by Architecture Standards |
| Language | TypeScript 5.x strict mode | ✅ Principle IV: TypeScript-First |
| Manifest | V3 with service worker | ✅ Architecture Standards |
| Structure | src/types/, src/extractors/, etc. | ✅ Exact match to constitution |
| Package Manager | npm | ✅ Compatible with constitution |
| CI/CD | GitHub Actions | ✅ Best practice, constitution compatible |
| Unit Testing | Vitest | ✅ Constitution allows Vitest |
| E2E Testing | Playwright | ✅ Constitution allows Playwright |
| Icon Generation | Sharp from thumbnail.jpg | ✅ Automated, high quality |
| Logging | console.log with prefixes | ✅ Supports debugging requirement |

---

## Next Steps

After research phase completion:
1. **Phase 1**: Generate data-model.md (minimal - extension has limited data)
2. **Phase 1**: Generate quickstart.md (developer onboarding guide)
3. **Phase 1**: No contracts/ needed (no API endpoints in initial setup)
4. **Phase 2**: Generate tasks.md with implementation tasks (via `/speckit.tasks` command)
