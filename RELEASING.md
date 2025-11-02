# Release Process for TweetYoink

This document outlines the steps for creating and publishing a new release of TweetYoink to the Chrome Web Store.

## Pre-Release Checklist

Before creating a release, ensure:

1. **All changes are committed** - Working tree should be clean
2. **Tests pass** - Run `npm run test` and `npm run type-check`
3. **Build succeeds** - Run `npm run build` to verify production build
4. **Manual testing complete** - Test the extension locally with critical user flows

## Version Numbering

TweetYoink follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes or major feature overhauls
- **MINOR** (0.X.0): New features, backward-compatible
- **PATCH** (0.0.X): Bug fixes, minor improvements

## Release Steps

### 1. Check Current Chrome Web Store Version

**CRITICAL**: Always verify the currently published version before creating a release.

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Find TweetYoink extension
3. Check the current published version number
4. Ensure your new version number is **higher** than the published version

### 2. Bump Version

Choose the appropriate npm script based on the type of changes:

```bash
# For bug fixes and minor improvements
npm run version:patch

# For new features (backward-compatible)
npm run version:minor

# For breaking changes (rarely used)
npm run version:major
```

This will:
- Update `package.json` version
- Sync version to `public/manifest.json`
- Create a git commit with the version bump
- Create a git tag (e.g., `v0.3.0`)

**Important**: If you get an error about an existing tag, the version has already been used. Check the Chrome Web Store version and bump to a higher version.

### 3. Build and Package

Create the production ZIP file for Chrome Web Store:

```bash
npm run package
```

This will:
- Build the extension in production mode (minified, no source maps)
- Validate the build and manifest
- **Check for version conflicts** (existing git tags or ZIP files)
- Create a ZIP file in `releases/tweetyoink-vX.Y.Z.zip`

**Version Conflict Detection**: If you see an error about version conflicts:
1. The version already exists as a git tag or release file
2. Check the Chrome Web Store for the currently published version
3. Bump to a higher version using `npm run version:patch` or `version:minor`
4. Run `npm run package` again

### 4. Push Changes

Push the commit and tag to GitHub:

```bash
git push origin main --tags
```

### 5. Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select TweetYoink extension
3. Click **"Package"** → **"Upload new package"**
4. Select the ZIP file from `releases/tweetyoink-vX.Y.Z.zip`
5. Update **"What's new in this version?"** with release notes
6. Click **"Submit for review"**

**Expected Review Time**: 1-3 business days (typically)

### 6. Monitor Release

After submission:
- Check for review feedback in the Developer Dashboard
- Monitor email for Chrome Web Store notifications
- Test the published version after approval

## Troubleshooting

### "Invalid version number" Error

**Error**: `Invalid version number in manifest: X.Y.Z. Please make sure the newly uploaded package has a larger version in file manifest.json than the published package: X.Y.Z`

**Cause**: You're trying to upload a version that's already published or equal to the current version.

**Solution**:
1. Check Chrome Web Store for current published version
2. Bump version to a higher number:
   ```bash
   npm run version:patch   # For X.Y.Z+1
   npm run version:minor   # For X.Y+1.0
   ```
3. Package again: `npm run package`
4. Try uploading again

### Version Conflict During Packaging

**Error**: `Version X.Y.Z conflicts detected: Git tag 'vX.Y.Z' already exists`

**Cause**: The package script detected that this version was already tagged/packaged.

**Solution**: Same as above - bump to a higher version and package again.

### Build Failures

If `npm run package` fails:
1. Run `npm run type-check` to fix TypeScript errors
2. Run `npm run build` to test production build
3. Fix any errors and commit changes
4. Try packaging again

## Quick Reference

```bash
# Standard release workflow
npm run type-check           # Verify no type errors
npm run build                # Test production build
npm run version:minor        # Bump version (or :patch/:major)
npm run package              # Create ZIP for Chrome Web Store
git push origin main --tags  # Push to GitHub

# Then upload releases/tweetyoink-vX.Y.Z.zip to Chrome Web Store
```

## Automated Checks

The package script (`scripts/package.ts`) automatically validates:

- ✓ Build directory exists and is valid
- ✓ Manifest.json is valid JSON with required fields
- ✓ Version is properly formatted
- ✓ No version conflicts (git tags, existing ZIP files)
- ✓ Package size is under Chrome Web Store limit (128MB)
- ✓ Warnings for large packages (>50MB)

These checks prevent common mistakes and ensure reliable releases.
