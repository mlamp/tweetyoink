# Data Model: Chrome Web Store Publishing

**Feature**: 007-chrome-store-publish
**Date**: 2025-11-01

## Overview

This feature is primarily build tooling and process automation, so the "data model" focuses on configuration files, package artifacts, and version management rather than traditional application data structures.

## Entities

### 1. Version Number

**Description**: Semantic version identifier synchronized across package.json and public/manifest.json.

**Structure**:
```typescript
// Semantic Versioning format: MAJOR.MINOR.PATCH
type SemanticVersion = string; // e.g., "0.1.0", "1.2.3"

// Pre-release variants also supported
// e.g., "0.1.0-0", "1.0.0-beta.1"
```

**Locations**:
- `package.json` → `version` field (source of truth after npm version runs)
- `public/manifest.json` → `version` field (synchronized from package.json)

**State Transitions**:
```
Initial: "0.1.0"
  ↓ npm run version:patch
"0.1.1" (both package.json and manifest.json updated)
  ↓ npm run version:minor
"0.2.0" (both files updated)
  ↓ npm run version:major
"1.0.0" (both files updated)
```

**Validation Rules**:
- MUST follow semantic versioning (MAJOR.MINOR.PATCH)
- MUST be synchronized between package.json and manifest.json
- MUST increment monotonically (no downgrades)
- Chrome Web Store requires version format: up to 4 dot-separated integers (we use 3)

**Invariants**:
- `package.json.version === public/manifest.json.version` at all times after sync

---

### 2. ZIP Package Artifact

**Description**: Distribution archive containing all files needed for Chrome Web Store submission.

**Structure**:
```typescript
interface ZIPPackage {
  filename: string;           // e.g., "tweetyoink-v0.1.0.zip"
  path: string;               // e.g., "releases/tweetyoink-v0.1.0.zip"
  size: number;               // File size in bytes
  createdAt: Date;            // Creation timestamp
  version: SemanticVersion;   // Version extracted from package.json
  contents: PackageContents;  // Files included in ZIP
}

interface PackageContents {
  // From dist/ (entire directory after build)
  'dist/manifest.json': File;
  'dist/assets/*.js': File[];
  'dist/assets/*.css': File[];
  'dist/icons/*.png': File[];
  // ... all other dist/ contents

  // From repository root
  'LICENSE': File;
  'README.md': File;
}
```

**Filename Convention**:
- Pattern: `{extension-name}-v{version}.zip`
- Example: `tweetyoink-v0.1.0.zip`, `tweetyoink-v1.2.3.zip`
- Version MUST match package.json version at time of packaging

**Location**: `releases/` directory (gitignored)

**Validation Rules**:
- MUST include all files from dist/ directory
- MUST include LICENSE and README.md from root
- MUST exclude development files (see Exclusion List below)
- MUST be under 128MB (Chrome Web Store limit)
- MUST contain valid manifest.json at dist/manifest.json

**Creation Process**:
```
1. Run production build: npm run build
2. Validate dist/ directory exists and contains manifest.json
3. Read version from package.json
4. Create releases/ directory if it doesn't exist
5. Archive files to releases/{name}-v{version}.zip
6. Report success with file size and location
```

---

### 3. Package Exclusion List

**Description**: Defined set of files and directories that MUST NOT be included in the distribution package.

**Structure**:
```typescript
interface ExclusionList {
  directories: string[];
  filePatterns: string[];
}

const EXCLUSIONS: ExclusionList = {
  directories: [
    'node_modules/',
    'src/',
    '.git/',
    '.specify/',
    'specs/',
    'scripts/',
    'releases/',
    'test-server/',
    'tests/',
    '.vite/',  // Vite build metadata in dist/
  ],
  filePatterns: [
    '*.log',
    '.env*',
    '.gitignore',
    '.gitattributes',
    'tsconfig.json',
    'vite.config.ts',
    'vitest.config.ts',
    'package.json',      // Not needed in extension
    'package-lock.json',
    '.DS_Store',
    'Thumbs.db',
  ]
};
```

**Rationale**:
- **node_modules/**: Build dependencies not needed in runtime
- **src/**: Source TypeScript compiled to dist/
- **.git/**: Version control not needed in distribution
- **.specify/, specs/**: Planning and documentation not needed
- **scripts/**: Build tooling not needed in runtime
- **releases/**: Would create recursive ZIP inclusion
- **test-server/**: Development testing server
- **Log files, env files**: Sensitive data and temporary files
- **Config files**: Build configuration not needed in extension

**Implementation**: Used via archiver's `ignore` option in glob patterns

---

### 4. Changelog Entry

**Description**: Human-readable description of changes for a specific version (P3 - nice to have).

**Structure**:
```typescript
interface ChangelogEntry {
  version: SemanticVersion;
  date: string;              // ISO 8601 date: "2025-11-01"
  changes: ChangeSection[];
  compareUrl?: string;       // Git compare URL for this version
}

interface ChangeSection {
  category: ChangeCategory;
  items: string[];           // Bullet points
}

type ChangeCategory =
  | 'Added'
  | 'Changed'
  | 'Deprecated'
  | 'Removed'
  | 'Fixed'
  | 'Security';
```

**File Format**: Markdown (CHANGELOG.md) following Keep a Changelog format

**Example**:
```markdown
## [0.2.0] - 2025-11-01
### Added
- Automated ZIP packaging for Chrome Web Store
- Version synchronization between package.json and manifest.json

### Changed
- Build workflow now includes release packaging option

## [0.1.0] - 2025-10-31
### Added
- Initial extension setup
- Tweet capture functionality
```

**Validation Rules**:
- Versions MUST be in reverse chronological order (newest first)
- Each version entry MUST have a date
- Changes MUST be categorized under standard categories
- Entries SHOULD be written in imperative mood ("Add feature" not "Added feature")

**Usage**:
- Manually updated by developer before version bump
- Current version section extracted for Chrome Web Store release notes
- Provides user-facing change documentation

---

### 5. npm Scripts Configuration

**Description**: Package.json scripts for packaging and version management workflows.

**Structure**:
```typescript
interface PackageJsonScripts {
  // Existing scripts (unchanged)
  "dev": string;
  "build": string;
  "build:dev": string;
  "watch": string;
  "watch:dev": string;
  "type-check": string;

  // New scripts for Feature 007
  "package": string;          // Create production ZIP package
  "version": string;          // Lifecycle hook: sync manifest version
  "version:patch": string;    // Bump patch version
  "version:minor": string;    // Bump minor version
  "version:major": string;    // Bump major version
}

const NEW_SCRIPTS: Partial<PackageJsonScripts> = {
  "package": "npm run build && tsx scripts/package.ts",
  "version": "tsx scripts/sync-version.ts && git add public/manifest.json",
  "version:patch": "npm version patch",
  "version:minor": "npm version minor",
  "version:major": "npm version major",
};
```

**Workflow**:
```
Developer runs: npm run version:minor
  ↓
npm version minor executes:
  1. Bumps version in package.json
  2. Runs "version" lifecycle hook:
     - tsx scripts/sync-version.ts (copies version to manifest.json)
     - git add public/manifest.json (stages manifest)
  3. Creates git commit "0.2.0"
  4. Creates git tag "v0.2.0"
  ↓
Developer runs: npm run package
  ↓
Executes:
  1. npm run build (production build)
  2. tsx scripts/package.ts (creates ZIP in releases/)
  ↓
Output: releases/tweetyoink-v0.2.0.zip ready for Chrome Web Store
```

---

### 6. Package Configuration

**Description**: devDependencies additions for archiver functionality.

**Structure**:
```typescript
interface PackageJsonDevDeps {
  // Existing dependencies
  "@crxjs/vite-plugin": "^2.0.0-beta.21";
  "@types/chrome": "^0.0.254";
  "typescript": "^5.3.0";
  "vite": "^5.0.0";
  // ... other existing deps

  // NEW for Feature 007
  "archiver": "^7.0.0";        // ZIP creation library
  "@types/archiver": "^6.0.0"; // TypeScript definitions
}
```

**Installation**:
```bash
npm install --save-dev archiver @types/archiver
```

---

## Relationships

```
┌─────────────────┐
│  package.json   │
│  version: 0.1.0 │
└────────┬────────┘
         │ npm version patch
         │ triggers sync-version.ts
         ↓
┌─────────────────┐
│ manifest.json   │
│ version: 0.1.1  │ (updated to match)
└─────────────────┘
         │
         │ npm run package
         │ triggers package.ts
         ↓
┌──────────────────────┐
│ ZIP Package Artifact │
│ tweetyoink-v0.1.1.zip│
│ Contents:            │
│  ├─ dist/            │
│  ├─ LICENSE          │
│  └─ README.md        │
└──────────────────────┘
         │
         │ manual upload
         ↓
┌─────────────────────┐
│ Chrome Web Store    │
│ Dashboard           │
└─────────────────────┘
```

## File System State

**Before Feature 007**:
```
tweetyoink/
├── package.json          (version: 0.1.0)
├── public/
│   └── manifest.json     (version: 0.1.0)
├── dist/                 (after build)
└── scripts/
    └── generate-icons.ts (existing)
```

**After Feature 007 Implementation**:
```
tweetyoink/
├── package.json          (version: 0.1.0, NEW SCRIPTS ADDED)
├── public/
│   └── manifest.json     (version: 0.1.0, SYNCHRONIZED)
├── dist/                 (after build)
├── scripts/
│   ├── generate-icons.ts (existing)
│   ├── package.ts        (NEW - ZIP creation)
│   └── sync-version.ts   (NEW - version sync)
├── releases/             (NEW DIRECTORY, gitignored)
│   └── tweetyoink-v0.1.0.zip (created by package.ts)
├── CHANGELOG.md          (NEW - P3/optional)
└── .gitignore            (UPDATED - excludes releases/)
```

## Validation & Constraints

### Version Synchronization Constraint
```typescript
// INVARIANT: Must hold true after any version operation
function validateVersionSync(): boolean {
  const pkgVersion = JSON.parse(
    fs.readFileSync('package.json', 'utf8')
  ).version;

  const manifestVersion = JSON.parse(
    fs.readFileSync('public/manifest.json', 'utf8')
  ).version;

  return pkgVersion === manifestVersion;
}

// MUST be true before packaging
assert(validateVersionSync());
```

### Package Size Constraint
```typescript
// CONSTRAINT: Chrome Web Store limit
const MAX_PACKAGE_SIZE = 128 * 1024 * 1024; // 128 MB

function validatePackageSize(zipPath: string): boolean {
  const stats = fs.statSync(zipPath);
  return stats.size <= MAX_PACKAGE_SIZE;
}
```

### Manifest Validation Constraint
```typescript
// CONSTRAINT: Valid manifest.json must exist in dist/
function validateManifestExists(): boolean {
  const manifestPath = 'dist/manifest.json';
  if (!fs.existsSync(manifestPath)) return false;

  try {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8')
    );
    // Basic validation
    return manifest.version && manifest.name && manifest.manifest_version;
  } catch {
    return false;
  }
}

// MUST be true before packaging
assert(validateManifestExists());
```

## Error States

### Version Desynchronization
**Cause**: Manual editing of package.json or manifest.json
**Detection**: Run sync-version.ts script
**Resolution**: Script overwrites manifest.json version with package.json version

### Missing dist/ Directory
**Cause**: Packaging attempted before building
**Detection**: Check fs.existsSync('dist/')
**Resolution**: Error message: "Run 'npm run build' before packaging"

### Oversized Package
**Cause**: Too many assets or unintended file inclusions
**Detection**: Check ZIP file size after creation
**Resolution**: Review exclusion list, remove unnecessary files from dist/

### Corrupted Manifest
**Cause**: Build error or manual editing
**Detection**: JSON.parse() throws error
**Resolution**: Fix manifest.json syntax, re-run build

## Notes

- This data model is unusually focused on build artifacts and configuration because Feature 007 is tooling automation rather than user-facing functionality
- No runtime data structures or API contracts needed (no contracts/ directory)
- Version state is persisted in package.json and manifest.json (not a database)
- Package artifacts (ZIP files) are ephemeral - regenerated on each build, not tracked in git
