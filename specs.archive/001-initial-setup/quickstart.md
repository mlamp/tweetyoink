# Quickstart Guide: TweetYoink Initial Setup

**Feature**: 001-initial-setup
**Date**: 2025-10-23
**Audience**: Developers setting up the TweetYoink extension for the first time

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Chrome** or a Chromium-based browser (Edge, Brave, Opera)
- **Git** (for cloning the repository)
- A code editor (VS Code recommended)

To verify your setup:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher
```

---

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd tweetyoink

# Install dependencies
npm install
```

Expected output:
```
added 150+ packages in 15s
```

### 2. Build the Extension

```bash
# Build for development
npm run build
```

Expected output:
```
vite v5.x.x building for production...
✓ built in 2.5s
Extension built to dist/
```

### 3. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from your project directory
5. You should see "TweetYoink" appear in your extensions list

**Success Indicators**:
- ✅ Extension appears with TweetYoink icon
- ✅ No error messages shown
- ✅ Extension status shows "Enabled"

### 4. Verify It Works

1. Click the TweetYoink icon in your Chrome toolbar
   - **Expected**: Popup opens with "TweetYoink" heading

2. Open Chrome DevTools (`F12` or right-click → Inspect)
   - Click "service worker" link in `chrome://extensions` under TweetYoink
   - **Expected**: Console shows `[TweetYoink Service Worker] Initialized`

3. Navigate to `https://twitter.com` or `https://x.com`
   - Open page DevTools console (`F12`)
   - **Expected**: Console shows `[TweetYoink Content Script] Loaded on https://twitter.com/...`

**If all three checks pass, your setup is complete! 🎉**

---

## Development Workflow

### Making Changes

After the initial setup, use this workflow for development:

#### 1. Start Watch Mode

```bash
npm run watch
```

This automatically rebuilds when you change files.

#### 2. Edit Source Files

```bash
# Example: Edit the popup
nano src/popup/popup.ts
# or open in your editor
```

#### 3. Reload Extension

After Vite rebuilds (watch mode shows "built in X.Xs"):
1. Go to `chrome://extensions`
2. Click the refresh icon ↻ on the TweetYoink extension
3. Refresh any open Twitter/X tabs to reload content script

#### 4. View Changes

- **Popup changes**: Click extension icon to see updates
- **Content script changes**: Reload Twitter/X page
- **Service worker changes**: Click "service worker" link to see new logs

**Tip**: Keep Chrome DevTools open to see console logs in real-time.

---

## Common Commands

```bash
# Development with watch mode
npm run watch          # Auto-rebuild on file changes

# One-time build
npm run build          # Build extension to dist/

# Type checking (no build)
npm run type-check     # Validate TypeScript types only

# Development server (with HMR)
npm run dev            # Vite dev server with hot reload

# Testing
npm run test           # Run Vitest unit/smoke tests
npm run test:watch     # Run tests in watch mode
npm run test:e2e       # Run Playwright E2E tests
npm run test:e2e:debug # Run E2E tests with debugging UI

# Asset generation
npm run generate-icons # Generate PNG icons from thumbnail.jpg
```

---

## Project Structure

After setup, your project looks like:

```
tweetyoink/
├── src/                    # Source code
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── extractors/
│   │   └── .gitkeep        # Placeholder for future extractors
│   ├── popup/
│   │   ├── popup.html      # Popup UI
│   │   ├── popup.ts        # Popup logic
│   │   └── popup.css       # Popup styles
│   ├── content-script.ts   # Runs on Twitter/X pages
│   └── service-worker.ts   # Background service worker
├── public/
│   ├── icons/              # Extension icons (generated)
│   └── manifest.json       # Extension configuration
├── tests/                  # Test files
│   ├── smoke/              # Vitest unit/smoke tests
│   └── e2e/                # Playwright E2E tests
├── scripts/
│   └── generate-icons.ts   # Icon generation script
├── tmp/
│   └── thumbnail.jpg       # Source thumbnail for icons
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI pipeline
├── dist/                   # Built extension (load this in Chrome)
├── node_modules/           # Dependencies (auto-generated)
├── package.json            # Project metadata
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Build config
├── vitest.config.ts        # Vitest test config
└── playwright.config.ts    # Playwright E2E config
```

**Key directories**:
- **`src/`**: Edit files here
- **`dist/`**: Built extension (this is what Chrome loads)
- **`public/`**: Static assets (icons, manifest)

---

## Running Tests

### Unit and Smoke Tests (Vitest)

Run basic smoke tests that validate the extension setup:

```bash
# Run all tests once
npm run test

# Watch mode (re-run on file changes)
npm run test:watch
```

**What's tested**:
- Manifest JSON is valid
- Required manifest fields present (name, version, manifest_version)
- TypeScript compiles without errors
- Build output exists in dist/
- Extension icons generated correctly

**Note**: E2E testing can be added in the future using MCP or other tools for automated browser testing.

---

## CI/CD Pipeline

The project includes a GitHub Actions workflow that automatically runs on every push and pull request.

### What CI Checks

1. **Type Check**: Validates TypeScript types (`npm run type-check`)
2. **Icon Generation**: Generates icons from thumbnail (`npm run generate-icons`)
3. **Build**: Compiles extension (`npm run build`)
4. **Unit Tests**: Runs smoke tests (`npm run test`)

### Viewing CI Results

1. Push code to GitHub
2. Go to the "Actions" tab in your repository
3. Click on the latest workflow run
4. View logs for each step

**CI Status Badge**: Add this to your README.md to show build status:
```markdown
[![CI](https://github.com/mlamp/tweetyoink/actions/workflows/ci.yml/badge.svg)](https://github.com/mlamp/tweetyoink/actions/workflows/ci.yml)
```

### Local CI Simulation

Run all CI checks locally before pushing:

```bash
npm run type-check && \
npm run generate-icons && \
npm run build && \
npm run test
```

If all commands succeed, your code will pass CI!

---

## Icon Generation

The extension uses automatically generated icons from a source thumbnail.

### Generating Icons

```bash
# Generate icons from source thumbnail
npm run generate-icons
```

This creates:
- `public/icons/icon-16.png` (16x16 - toolbar icon)
- `public/icons/icon-48.png` (48x48 - management page)
- `public/icons/icon-128.png` (128x128 - Chrome Web Store)

**Source**: Place your thumbnail image at `public/assets/thumbnail.jpg` (any size, JPEG format)

**When to regenerate**:
- After updating `public/assets/thumbnail.jpg`
- Before committing if icons are missing
- Automatically runs in CI pipeline

---

## Debugging Tips

### View Service Worker Logs
1. Go to `chrome://extensions`
2. Find TweetYoink
3. Click "service worker" link
4. DevTools console opens showing service worker logs

### View Content Script Logs
1. Navigate to `https://twitter.com` or `https://x.com`
2. Open page DevTools (`F12`)
3. Check console for `[TweetYoink Content Script]` messages

### View Popup Logs
1. Click TweetYoink icon to open popup
2. Right-click inside popup → "Inspect"
3. DevTools console opens showing popup logs

### Common Issues

**Issue**: Extension not appearing after "Load unpacked"
- **Solution**: Make sure you selected the `dist/` folder, not the root folder
- **Verify**: `dist/` should contain `manifest.json` after building

**Issue**: "Manifest file is missing or unreadable"
- **Solution**: Run `npm run build` first to create the `dist/` folder
- **Verify**: Check that `dist/manifest.json` exists

**Issue**: TypeScript errors during build
- **Solution**: Run `npm run type-check` to see detailed type errors
- **Fix**: Address type errors in source files
- **Verify**: `npm run type-check` should complete with no errors

**Issue**: Content script not loading on Twitter/X
- **Solution**: Refresh the Twitter/X page after loading extension
- **Verify**: Open DevTools console and look for `[TweetYoink Content Script]` message

**Issue**: Changes not appearing after editing code
- **Solution**:
  1. Ensure watch mode is running (`npm run watch`)
  2. Wait for "built in X.Xs" message
  3. Reload extension in `chrome://extensions`
  4. Refresh any open Twitter/X tabs

---

## Validation Checklist

Use this checklist to verify your setup:

- [ ] Node.js 18+ installed
- [ ] `npm install` completed successfully
- [ ] `npm run build` completed without errors
- [ ] Extension loaded in Chrome via "Load unpacked"
- [ ] Extension appears in `chrome://extensions` with no errors
- [ ] Extension icon visible in Chrome toolbar
- [ ] Popup opens when clicking icon
- [ ] Service worker logs initialization message
- [ ] Content script logs message on Twitter/X
- [ ] `npm run watch` rebuilds on file changes
- [ ] Reload extension button (↻) works in `chrome://extensions`

**If all items are checked, your development environment is ready!**

---

## Next Steps

Now that your initial setup is complete, you can:

1. **Explore the codebase**: Familiarize yourself with `src/` directory structure
2. **Read the constitution**: Check `.specify/memory/constitution.md` for project principles
3. **Review the spec**: See `specs/001-initial-setup/spec.md` for requirements
4. **Start development**: Wait for `/speckit.tasks` to generate implementation tasks
5. **Follow TDD**: If tests are added later, write tests before implementation

---

## Additional Resources

- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/mv3/
- **Vite Documentation**: https://vitejs.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **@crxjs/vite-plugin**: https://crxjs.dev/vite-plugin/

---

## Support

If you encounter issues not covered in this guide:

1. Check the **Common Issues** section above
2. Review `specs/001-initial-setup/research.md` for technical decisions
3. Check TypeScript errors with `npm run type-check`
4. Verify Chrome DevTools console for error messages

---

**Last Updated**: 2025-10-23
**Version**: 0.1.0 (Initial Setup)
