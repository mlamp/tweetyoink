# Data Model: Initial Project Setup

**Feature**: 001-initial-setup
**Date**: 2025-10-23
**Phase**: Phase 1 - Design

## Overview

The initial project setup has a minimal data model focused on extension metadata and configuration. This document defines the data structures used in the initial setup phase.

---

## Configuration Data

### ExtensionConfig (Future)

While no user configuration is implemented in the initial setup, the structure is prepared for future use.

**Purpose**: Store user preferences and backend configuration
**Storage**: Chrome Storage API (sync storage for cross-device settings)
**Scope**: Will be implemented in future features

**Placeholder Type Definition** (src/types/index.ts):
```typescript
// Future: User configuration for backend connectivity
interface ExtensionConfig {
  backendUrl?: string;
  apiKey?: string;
  // Additional fields to be added in future features
}
```

**Notes**:
- Not implemented in initial setup
- Structure defined for consistency with future features
- Will use chrome.storage.sync API when implemented

---

## Extension Metadata

### Manifest Data

**Purpose**: Define extension identity, permissions, and entry points
**Storage**: public/manifest.json (static configuration)
**Scope**: Initial setup

**Structure**:
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
    "service_worker": "src/service-worker.ts"
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

**Key Fields**:
- `manifest_version`: 3 (Manifest V3 requirement)
- `name`: "TweetYoink" (extension display name)
- `version`: "0.1.0" (semantic versioning)
- `permissions`: Minimal set for initial functionality
- `host_permissions`: Twitter and X domains only

---

## Build Configuration Data

### TypeScript Config

**Purpose**: Define TypeScript compilation settings
**Storage**: tsconfig.json (static configuration)
**Scope**: Initial setup

**Key Settings**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "moduleResolution": "bundler",
    "types": ["chrome", "vite/client"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Rationale**:
- `strict: true` - Constitutional requirement (Principle IV)
- `target: ES2020` - Modern Chrome supports ES2020
- `types: ["chrome"]` - Chrome extension API types

### Vite Config

**Purpose**: Define build system configuration
**Storage**: vite.config.ts (static configuration)
**Scope**: Initial setup

**Key Settings**:
```typescript
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
```

---

## Runtime Data (Logs)

### Log Messages

**Purpose**: Debugging and validation during development
**Storage**: Chrome DevTools console (ephemeral)
**Scope**: Initial setup

**Format**:
```typescript
// Service Worker
'[TweetYoink Service Worker] Initialized'

// Content Script
'[TweetYoink Content Script] Loaded on https://twitter.com/...'

// Popup
'[TweetYoink Popup] Opened'
```

**Characteristics**:
- **Prefix**: `[TweetYoink ComponentName]` for easy filtering
- **Ephemeral**: Not persisted, only visible in DevTools
- **Purpose**: Validates FR-012 (initialization logging)

---

## Package Metadata

### package.json

**Purpose**: Define Node.js project metadata and dependencies
**Storage**: package.json (static configuration)
**Scope**: Initial setup

**Key Fields**:
```json
{
  "name": "tweetyoink",
  "version": "0.1.0",
  "type": "module",
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
  },
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

---

## CI/CD Configuration Data

### GitHub Actions Workflow

**Purpose**: Define automated build, test, and validation pipeline
**Storage**: .github/workflows/ci.yml (static configuration)
**Scope**: Initial setup

**Structure**:
```yaml
name: CI

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run generate-icons
      - run: npm run build
      - run: npm run test
      - run: npm run test:e2e
```

**Key Fields**:
- `on`: `[push, pull_request]` - Triggers on all branches and PRs
- `runs-on`: `ubuntu-latest` - Linux runner
- `node-version`: `'20'` - Node.js 20.x LTS
- `cache`: `'npm'` - Cache node_modules for faster builds

**Performance Target**: Complete in <5 minutes (SC-009)

### Vitest Configuration

**Purpose**: Configure unit and smoke testing framework
**Storage**: vitest.config.ts (static configuration)
**Scope**: Initial setup

**Structure**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/**/*.test.ts']
  }
});
```

**Test Data**:
- Location: `tests/smoke/*.test.ts`
- Coverage: Basic smoke tests (manifest validation, build success)
- Execution: `npm run test`

### Playwright Configuration

**Purpose**: Configure E2E extension testing
**Storage**: playwright.config.ts (static configuration)
**Scope**: Initial setup

**Structure**:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    headless: false,
  },
});
```

**Test Data**:
- Location: `tests/e2e/*.spec.ts`
- Coverage: Extension load verification
- Execution: `npm run test:e2e`

---

## Asset Generation Data

### Icon Generation Script

**Purpose**: Generate PNG icons from source thumbnail
**Storage**: scripts/generate-icons.ts (executable script)
**Scope**: Initial setup

**Input Data**:
- Source: `tmp/thumbnail.jpg`
- Format: JPEG image (any size)

**Output Data**:
- `public/icons/icon-16.png` - 16x16 PNG
- `public/icons/icon-48.png` - 48x48 PNG
- `public/icons/icon-128.png` - 128x128 PNG

**Processing**:
```typescript
import sharp from 'sharp';

for (const size of [16, 48, 128]) {
  await sharp('tmp/thumbnail.jpg')
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
}
```

**Validation**:
- Check source file exists
- Verify output directory exists
- Confirm all 3 sizes generated

---

## Data Flow

### Development Workflow Data Flow

```
Developer Changes Source File (src/*.ts)
         ↓
Vite Detects Change (watch mode)
         ↓
TypeScript Compiler Validates Types
         ↓
Vite Builds to dist/
         ↓
Chrome Extension Reloads
         ↓
Components Log Initialization (console)
         ↓
Developer Views Logs (DevTools)
```

### Extension Load Data Flow

```
Developer Clicks "Load unpacked"
         ↓
Chrome Reads manifest.json from dist/
         ↓
Chrome Validates Manifest Schema
         ↓
Chrome Registers Extension
         ↓
Service Worker Initializes (logs message)
         ↓
User Visits Twitter/X
         ↓
Content Script Injects (logs message)
         ↓
User Clicks Extension Icon
         ↓
Popup Opens (logs message)
```

---

## Data Validation

### Manifest Validation

**Validator**: Chrome browser (built-in)
**Rules**:
- `manifest_version` must be 3
- All required fields present (`name`, `version`, `manifest_version`)
- Permissions array valid
- File paths exist in build output

**Error Handling**: Chrome shows error message if validation fails

### TypeScript Validation

**Validator**: TypeScript compiler (tsc)
**Rules**:
- Strict mode enabled
- No `any` types without justification
- All imports resolve
- Type annotations consistent

**Error Handling**: Build fails with compile errors

---

## Future Data Models

The following data models will be added in future features:

### TweetData (Future)
From constitution FR-1, will include:
- Tweet ID, text, author
- Metrics (likes, retweets, etc.)
- Timestamp, URL
- Media references

### UserContext (Future)
From constitution FR-2, will include:
- Draft reply text
- Reply target ID
- Capture timestamp

### CapturePayload (Future)
From constitution, will include:
- TweetData
- UserContext
- Metadata (confidence scores, extraction method)

These structures are defined in `docs/Constitution.md` but not implemented in initial setup.

---

## Summary

The initial project setup has a **minimal data model** consisting of:

1. **Configuration Files**: manifest.json, tsconfig.json, vite.config.ts, package.json, vitest.config.ts, playwright.config.ts
2. **Metadata**: Extension name, version, permissions
3. **Build Settings**: TypeScript strict mode, Vite plugin configuration
4. **Runtime Logs**: Console messages for debugging
5. **CI/CD Configuration**: GitHub Actions workflow (.github/workflows/ci.yml)
6. **Test Configuration**: Vitest and Playwright configs
7. **Asset Generation**: Icon generation script (scripts/generate-icons.ts)
8. **Asset Data**: Source thumbnail (tmp/thumbnail.jpg) and generated PNG icons

**No persistent user data** is stored in the initial setup. Configuration storage (Chrome Storage API) will be implemented in future features when backend connectivity is added.

All data models align with constitutional requirements:
- ✅ TypeScript strict mode (Principle IV)
- ✅ Manifest V3 (Architecture Standards)
- ✅ Separation of concerns (no backend in extension repo)
- ✅ Testing framework choice (Vitest + Playwright per constitution)
- ✅ Automated CI/CD for quality gates
