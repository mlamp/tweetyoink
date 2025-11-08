# Release Management - Technical Design

## Context

Release management automates packaging and versioning for Chrome Web Store submissions. The implementation must integrate with the existing Vite build system while providing cross-platform scripts that work reliably on both macOS and Linux.

## Goals / Non-Goals

**Goals:**
- Single-command ZIP package creation with proper file filtering
- Synchronized version management across package.json and manifest.json
- Cross-platform compatibility (macOS and Linux)
- Fast packaging (<30 seconds)
- Reproducible builds

**Non-Goals:**
- Automated Chrome Web Store API submission (manual upload acceptable)
- Multi-browser packaging (Chrome only)
- Code signing/CRX generation (Chrome Web Store handles this)
- Windows support
- Beta channel management

## Decisions

### Decision: Packaging Implementation

**Approach:** Node.js TypeScript script using archiver library:
```typescript
// scripts/package.ts
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

async function createPackage() {
  const manifest = JSON.parse(
    fs.readFileSync('public/manifest.json', 'utf8')
  );
  const version = manifest.version;
  const zipPath = `releases/tweetyoink-v${version}.zip`;

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Include only distribution files
  archive.directory('dist/', false);
  archive.file('LICENSE', { name: 'LICENSE' });
  archive.file('README.md', { name: 'README.md' });

  archive.pipe(output);
  await archive.finalize();
}
```

**NPM Script:**
```json
{
  "scripts": {
    "package": "npm run build && tsx scripts/package.ts"
  }
}
```

**Alternatives Considered:**
1. **Shell script with zip command** - Rejected: Not truly cross-platform, harder to maintain exclusion logic
2. **gulp or grunt** - Rejected: Unnecessary dependency, overkill for simple archiving
3. **Manual webpack plugin** - Rejected: Couples packaging to build tool

**Rationale:** TypeScript script provides type safety and maintainability. Archiver is battle-tested (14M weekly downloads). Separating packaging from build allows flexibility.

### Decision: Version Management Strategy

**Approach:** Dual-file synchronization with TypeScript script:
```typescript
// scripts/bump-version.ts
import fs from 'fs';

type BumpType = 'major' | 'minor' | 'patch';

function bumpVersion(type: BumpType) {
  // Read both files
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));

  // Validate sync
  if (pkg.version !== manifest.version) {
    console.error('Version mismatch! package.json and manifest.json out of sync.');
    process.exit(1);
  }

  // Parse version
  const [major, minor, patch] = pkg.version.split('.').map(Number);

  // Calculate new version
  let newVersion: string;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  // Update both files
  pkg.version = newVersion;
  manifest.version = newVersion;

  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Version bumped: ${pkg.version} → ${newVersion}`);
}
```

**NPM Scripts:**
```json
{
  "scripts": {
    "version:patch": "tsx scripts/bump-version.ts patch",
    "version:minor": "tsx scripts/bump-version.ts minor",
    "version:major": "tsx scripts/bump-version.ts major"
  }
}
```

**Alternatives Considered:**
1. **npm version command only** - Rejected: Doesn't update manifest.json
2. **Post-version hook to sync manifest** - Rejected: npm version creates git commits automatically, unwanted coupling
3. **Single source of truth (manifest only)** - Rejected: package.json version needed for npm ecosystem

**Rationale:** Explicit TypeScript script provides full control over both files. Version mismatch detection prevents drift. Simple semantic versioning logic is easy to understand and maintain.

### Decision: File Exclusion Strategy

**Approach:** Explicit inclusion (whitelist) rather than exclusion (blacklist):
```typescript
const INCLUDED_PATHS = [
  'dist/',           // Built extension
  'LICENSE',         // License file
  'README.md',       // Documentation
  'CHANGELOG.md'     // Optional changelog
];

// Only include paths from whitelist
for (const path of INCLUDED_PATHS) {
  if (fs.existsSync(path)) {
    if (fs.statSync(path).isDirectory()) {
      archive.directory(path, path);
    } else {
      archive.file(path, { name: path });
    }
  }
}
```

**Alternatives Considered:**
1. **Exclusion list (.npmignore style)** - Rejected: Easy to miss new files that shouldn't be included
2. **Include everything except...** - Rejected: Safer to explicitly include only what's needed
3. **Mirror npm pack behavior** - Rejected: npm pack doesn't understand Chrome extension structure

**Rationale:** Whitelist approach is more secure - new files won't accidentally leak into packages. Clear and explicit about what ships to users.

### Decision: Output Directory Structure

**Approach:** Dedicated releases/ directory with gitignore:
```
releases/
├── tweetyoink-v0.1.0.zip
├── tweetyoink-v0.2.0.zip
└── tweetyoink-v1.0.0.zip
```

**.gitignore:**
```
releases/
*.zip
```

**Alternatives Considered:**
1. **Output to dist/** - Rejected: Mixes build artifacts with release artifacts
2. **Output to root directory** - Rejected: Clutters repository root
3. **No dedicated directory** - Rejected: Hard to find packages

**Rationale:** Dedicated directory keeps releases organized. Gitignore prevents accidental commits of large binary files. Version in filename makes releases self-documenting.

### Decision: Manifest Validation

**Approach:** Pre-packaging validation with clear errors:
```typescript
function validateManifest() {
  if (!fs.existsSync('public/manifest.json')) {
    throw new Error('manifest.json not found in public/ directory');
  }

  try {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));

    // Required fields
    const required = ['manifest_version', 'name', 'version', 'description'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`manifest.json missing required field: ${field}`);
      }
    }

    // Version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}. Expected MAJOR.MINOR.PATCH`);
    }

    return manifest;
  } catch (e) {
    throw new Error(`Invalid manifest.json: ${e.message}`);
  }
}
```

**Alternatives Considered:**
1. **Skip validation, let Chrome Web Store reject** - Rejected: Wastes time, poor DX
2. **JSON Schema validation** - Deferred: Can add later for more comprehensive checks
3. **Manifest V3 specific validation** - Deferred: Basic checks sufficient for MVP

**Rationale:** Early validation prevents wasted packaging time. Clear error messages guide developers to fix issues quickly.

### Decision: Build Integration

**Approach:** Explicit build step before packaging:
```json
{
  "scripts": {
    "package": "npm run build && tsx scripts/package.ts"
  }
}
```

**Alternatives Considered:**
1. **Automatic build detection** - Rejected: Silent failures if build is stale
2. **Package without building** - Rejected: Risk of packaging outdated code
3. **Incremental packaging** - Rejected: Unnecessary complexity

**Rationale:** Explicit build ensures package always contains latest code. Fail-fast approach (build errors stop packaging).

### Decision: Changelog Management

**Approach:** Optional CHANGELOG.md with manual editing following Keep a Changelog format.

**Format Documentation:** See `.github/CHANGELOG_TEMPLATE.md` for:
- Capability-based organization conventions
- Entry templates and examples
- Writing guidelines and best practices
- Versioning principles

**Version bump can optionally create template:**
```typescript
function appendChangelogTemplate(version: string) {
  if (!fs.existsSync('CHANGELOG.md')) {
    fs.writeFileSync('CHANGELOG.md', '# Changelog\n\n');
  }

  const template = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`;
  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

  // Insert after header
  const updated = changelog.replace(
    '# Changelog\n\n',
    `# Changelog\n\n${template}`
  );

  fs.writeFileSync('CHANGELOG.md', updated);
}
```

**Alternatives Considered:**
1. **Automated changelog from git commits** - Rejected: Commits may not be user-facing
2. **Required changelog entries** - Rejected: Unnecessary friction for minor updates
3. **No changelog support** - Rejected: Helpful for tracking what changed
4. **Embed format docs in CHANGELOG.md** - Rejected: Clutters actual changelog with meta-documentation

**Rationale:** Optional approach provides flexibility. Manual editing ensures quality, user-friendly release notes. Separate template file keeps CHANGELOG.md clean with only actual release entries.

## Risks / Trade-offs

**Risk:** Different Node.js versions produce different ZIP outputs
- **Mitigation:** Document required Node.js version (18+), use deterministic archiver settings
- **Trade-off:** Cannot guarantee byte-identical ZIPs across different environments

**Risk:** Large package size exceeds Chrome Web Store limit
- **Mitigation:** Warning when package >100MB, error at 128MB
- **Trade-off:** Manual investigation needed if limit approached

**Risk:** Version drift between package.json and manifest.json
- **Mitigation:** Version mismatch detection in bump script
- **Trade-off:** Cannot use standard npm version command

**Risk:** Forgotten pre-packaging steps (build, tests)
- **Mitigation:** Package script runs build automatically
- **Trade-off:** Slower packaging (but safer)

## Migration Plan

**Phase 1: Basic Packaging (P1)**
1. Create scripts/package.ts
2. Add archiver dependency
3. Implement file inclusion whitelist
4. Add npm run package script
5. Create releases/ directory
6. Test manual upload to Chrome Web Store

**Phase 2: Version Management (P2)**
1. Create scripts/bump-version.ts
2. Implement semantic versioning logic
3. Add version mismatch detection
4. Add npm scripts for version:patch/minor/major
5. Update packaging to use bumped version

**Phase 3: Changelog Support (P3)**
1. Create CHANGELOG.md template
2. Add optional changelog entry generation on bump
3. Include changelog in package if present

**Rollback:** Each phase is independent. Can roll back to manual versioning/packaging if automation fails.

## Open Questions

None - all architectural questions resolved in design phase.
