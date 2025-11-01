# Quickstart: Chrome Web Store Publishing

**Feature**: 007-chrome-store-publish
**Audience**: Developers preparing releases for Chrome Web Store
**Time to First Package**: ~5 minutes

## Prerequisites

Before you start, ensure you have:

- ✅ Node.js 18+ and npm installed
- ✅ TweetYoink repository cloned and dependencies installed (`npm install`)
- ✅ Successful production build (`npm run build` completes without errors)
- ✅ Git initialized and working (version management creates commits/tags)

## Quick Start (3 Steps)

### 1. Install Dependencies

```bash
# Add archiver for ZIP creation
npm install --save-dev archiver @types/archiver
```

### 2. Bump Version (Optional)

If this is a new release (skip if packaging existing version):

```bash
# Bump patch version (0.1.0 → 0.1.1)
npm run version:patch

# OR bump minor version (0.1.0 → 0.2.0)
npm run version:minor

# OR bump major version (0.1.0 → 1.0.0)
npm run version:major
```

This will:
- Update `package.json` version
- Sync version to `public/manifest.json`
- Create a git commit and tag

### 3. Create Package

```bash
# Create production ZIP package
npm run package
```

This will:
- Run production build (`npm run build`)
- Create `releases/tweetyoink-v{version}.zip`
- Report file size and location

**Output**: `releases/tweetyoink-v0.1.0.zip` ready for Chrome Web Store upload! 🎉

---

## Complete Workflow Example

Here's a complete release workflow from development to Chrome Web Store:

```bash
# 1. Ensure you're on a clean branch
git status

# 2. Run type checking (optional but recommended)
npm run type-check

# 3. Bump version for new release
npm run version:minor
# Output: version bumped to 0.2.0, git commit + tag created

# 4. Create production package
npm run package
# Output:
#   ✓ Production build completed
#   ✓ Package created: releases/tweetyoink-v0.2.0.zip (5.2 MB)

# 5. Verify the package
unzip -l releases/tweetyoink-v0.2.0.zip | head -20
# Inspect contents to ensure proper files included

# 6. Push version bump to GitHub
git push origin main --follow-tags

# 7. Upload to Chrome Web Store
# Go to: https://chrome.google.com/webstore/devconsole
# Navigate to your extension → "Package"
# Drop releases/tweetyoink-v0.2.0.zip
# Fill in release notes (use CHANGELOG.md)
# Submit for review
```

**Time**: ~5 minutes (excluding Chrome Web Store review time)

---

## Common Tasks

### Package Current Version (No Version Bump)

If you just want to re-package the current version:

```bash
npm run package
```

### Check Current Version

```bash
# Check package.json version
npm version

# Or read directly
cat package.json | grep version
cat public/manifest.json | grep version
```

Both should show the same version. If they don't match, run:

```bash
npm run version:patch  # This will sync them
```

### List All Release Packages

```bash
ls -lh releases/
```

### Verify Package Contents

```bash
# List all files in the ZIP
unzip -l releases/tweetyoink-v0.1.0.zip

# Extract to temporary directory for inspection
mkdir -p /tmp/tweetyoink-verify
unzip releases/tweetyoink-v0.1.0.zip -d /tmp/tweetyoink-verify
tree /tmp/tweetyoink-verify
```

### Clean Old Packages

```bash
# Remove all old packages (keep only latest)
rm releases/tweetyoink-v0.1.*.zip

# Or remove all packages (start fresh)
rm -rf releases/
```

---

## Troubleshooting

### Problem: "Cannot find module 'archiver'"

**Solution**: Install dependencies first:
```bash
npm install
```

### Problem: "dist/ directory not found"

**Solution**: Run production build:
```bash
npm run build
```

The `package` script runs build automatically, but manual build failures may cause this.

### Problem: Version mismatch between package.json and manifest.json

**Symptom**:
```bash
cat package.json | grep version  # Shows 0.1.0
cat public/manifest.json | grep version  # Shows 0.2.0
```

**Solution**: Sync versions by running a version bump:
```bash
# This will set both to 0.1.1
npm run version:patch
```

Or manually edit one to match the other, then commit.

### Problem: Package is too large (>128MB)

**Solution**: Check what's being included:
```bash
unzip -l releases/tweetyoink-v*.zip | wc -l  # Count files
unzip -l releases/tweetyoink-v*.zip | sort -k4 -n -r | head -20  # Largest files
```

Common causes:
- Development files accidentally included (check exclusion list in package.ts)
- Unoptimized images in dist/
- Vite build artifacts (.vite/ directory)

Fix by updating exclusion patterns in `scripts/package.ts`.

### Problem: Git commit fails during version bump

**Symptom**:
```
npm ERR! Git working directory not clean.
```

**Solution**: Commit or stash changes first:
```bash
git status
git add .
git commit -m "Prepare for version bump"

# Then run version bump
npm run version:patch
```

### Problem: Chrome Web Store rejects the package

**Common Reasons**:
1. **Invalid manifest.json**: Verify with Chrome extension validator
2. **Missing required files**: Ensure icons exist in all required sizes (16x16, 48x48, 128x128)
3. **Permissions issues**: Check manifest.json permissions are minimal and justified
4. **Content Security Policy violations**: Review CSP in manifest.json

**Solution**: Inspect the ZIP manually:
```bash
unzip -p releases/tweetyoink-v*.zip dist/manifest.json | jq
```

Validate manifest at: https://developer.chrome.com/docs/extensions/mv3/manifest/

---

## Advanced Usage

### Pre-release Versions

For beta testing:

```bash
# Create pre-release version (0.1.0 → 0.1.1-0)
npm version prepatch

# Increment pre-release (0.1.1-0 → 0.1.1-1)
npm version prerelease

# Package the pre-release
npm run package
# Output: releases/tweetyoink-v0.1.1-0.zip
```

### Custom Version

Set specific version:

```bash
npm version 1.0.0-beta.5
npm run package
```

### Manual Packaging (Debug)

Run packaging script directly with tsx:

```bash
tsx scripts/package.ts
```

This skips the production build step (assumes dist/ is already built).

---

## File Locations Reference

| File/Directory | Purpose | Tracked in Git? |
|----------------|---------|-----------------|
| `package.json` | Version source of truth, npm scripts | ✅ Yes |
| `public/manifest.json` | Chrome extension manifest with version | ✅ Yes |
| `scripts/package.ts` | ZIP creation script | ✅ Yes |
| `scripts/sync-version.ts` | Version synchronization script | ✅ Yes |
| `releases/` | Output directory for ZIP files | ❌ No (gitignored) |
| `releases/tweetyoink-v*.zip` | Distribution packages | ❌ No (regenerated) |
| `CHANGELOG.md` | Release notes (P3/optional) | ✅ Yes |
| `dist/` | Vite build output | ❌ No (generated) |

---

## Next Steps

After creating your package:

1. **Test locally**: Load the unpacked extension from the ZIP contents to verify
2. **Update CHANGELOG.md** (P3/optional): Document changes for this version
3. **Upload to Chrome Web Store**: https://chrome.google.com/webstore/devconsole
4. **Submit for review**: Chrome typically reviews within 1-3 days
5. **Tag release in GitHub** (optional): Already done by npm version, but can create GitHub Release UI

---

## Tips & Best Practices

### ✅ Do

- **Always run `npm run type-check`** before creating a release
- **Test the extension locally** after building but before packaging
- **Use semantic versioning correctly**: patch for fixes, minor for features, major for breaking changes
- **Keep CHANGELOG.md updated** for user-facing release notes
- **Verify package contents** before uploading to Chrome Web Store
- **Push git tags** so GitHub has release history

### ❌ Don't

- Don't manually edit version numbers in package.json or manifest.json (use `npm version`)
- Don't commit releases/ directory (it's gitignored for a reason)
- Don't skip the production build (always use `npm run package`, not manual packaging)
- Don't upload ZIP files larger than 128MB (Chrome Web Store limit)
- Don't forget to git push tags (`git push --follow-tags`)

---

## Getting Help

If you encounter issues:

1. **Check build logs**: Look for errors in `npm run build` output
2. **Verify package contents**: Use `unzip -l` to inspect the ZIP
3. **Check Chrome Web Store docs**: https://developer.chrome.com/docs/webstore/
4. **Review this quickstart**: Ensure all prerequisites are met
5. **Open an issue**: If stuck, create a GitHub issue with error details

---

**Last Updated**: 2025-11-01
**Related Docs**: [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md)
