# Testing Guide for TweetYoink

This document provides step-by-step instructions for testing all features after implementation.

## Phase 3: User Story 1 - Load Extension in Developer Mode

### T021-T026: Manual Testing Steps

1. **Load Extension**:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" toggle
   - Click "Load unpacked"
   - Select the `dist/` folder
   - **Expected**: Extension loads without errors

2. **Verify Extension Appearance**:
   - **Expected**: "TweetYoink" appears in extension list
   - **Expected**: Extension icon visible in toolbar
   - **Expected**: No errors or warnings shown

3. **Test Service Worker**:
   - Click "service worker" link under TweetYoink
   - **Expected**: DevTools opens
   - **Expected**: Console shows `[TweetYoink Service Worker] Initialized`

4. **Test Content Script**:
   - Navigate to `https://twitter.com` or `https://x.com`
   - Open page DevTools (F12)
   - **Expected**: Console shows `[TweetYoink Content Script] Loaded on https://twitter.com/...`

5. **Test Popup**:
   - Click TweetYoink extension icon
   - **Expected**: Popup opens with "TweetYoink" heading
   - Right-click popup → Inspect
   - **Expected**: Console shows `[TweetYoink Popup] Opened`

---

## Phase 4: User Story 2 - Build and Reload Extension

### T030-T042: Development Workflow Testing

1. **Test Watch Mode** (T030-T032):
   ```bash
   npm run watch
   ```
   - Terminal should show Vite watch mode running
   - Make a change to `src/popup/popup.ts` (add a comment)
   - **Expected**: Vite automatically rebuilds
   - **Expected**: Output shows "built in X.Xs"

2. **Test Popup Changes** (T033-T034):
   - Go to `chrome://extensions`
   - Click reload button (↻) on TweetYoink
   - Click extension icon to open popup
   - **Expected**: Changes appear in popup

3. **Test Content Script Changes** (T035-T038):
   - Make a change to `src/content-script.ts` (update log message)
   - **Expected**: Vite rebuilds automatically
   - Reload extension in `chrome://extensions`
   - Refresh Twitter/X tab
   - **Expected**: Updated log message appears in console

4. **Test TypeScript Validation** (T039-T042):
   ```bash
   npm run type-check
   ```
   - **Expected**: No errors, exits successfully

   Add a TypeScript error (e.g., `const x: number = "string";` in popup.ts):
   ```bash
   npm run type-check
   ```
   - **Expected**: Type error shown with clear message

   Fix the error and run again:
   ```bash
   npm run type-check
   ```
   - **Expected**: No errors

5. **Measure Iteration Time** (T042):
   - Make a code change
   - Run build
   - Reload extension
   - Verify change in Chrome
   - **Expected**: Total time < 30 seconds

---

## Phase 5: User Story 3 - View Extension Logs

### T043-T056: Logging Verification

1. **Verify Log Prefixes** (T043-T045):
   - Service worker logs should start with `[TweetYoink Service Worker]`
   - Content script logs should start with `[TweetYoink Content Script]`
   - Popup logs should start with `[TweetYoink Popup]`

2. **Test Service Worker Logs** (T046-T047):
   - Navigate to `chrome://extensions`
   - Click "service worker" link under TweetYoink
   - **Expected**: DevTools console opens
   - **Expected**: Initialization message visible

3. **Test Content Script Logs** (T048-T050):
   - Navigate to `https://twitter.com` or `https://x.com`
   - Open page DevTools (F12)
   - **Expected**: Content script initialization log with current URL

4. **Test Popup Logs** (T051-T053):
   - Click TweetYoink extension icon
   - Right-click popup → Inspect
   - **Expected**: Popup DevTools opens
   - **Expected**: Initialization message visible

5. **Test Stability** (T054-T056):
   - Navigate between different Twitter/X pages (timeline, profile, tweet detail)
   - **Expected**: Content script logs on each page load
   - **Expected**: No crashes or uncaught errors in any console

---

## Success Criteria Validation

After completing all testing, verify these criteria:

- [ ] **SC-001**: Developer can load extension in Chrome in under 1 minute
- [ ] **SC-002**: Extension appears in chrome://extensions with no errors or warnings
- [ ] **SC-003**: Code change → rebuild → see change in under 30 seconds
- [ ] **SC-004**: All components (service worker, content script, popup) initialize and log successfully
- [ ] **SC-005**: Extension stable when navigating between Twitter/X pages (no crashes/errors)
- [ ] **SC-006**: Developer can view logs from all components using Chrome DevTools
- [ ] **SC-007**: Build command completes in under 10 seconds (verified: 62ms ✓)
- [ ] **SC-008**: Extension structure follows constitutional layout (verified ✓)

---

## Quick Test Commands

```bash
# Build
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Type check
npm run type-check

# Dev server with HMR (alternative)
npm run dev
```

## Troubleshooting

### Extension not loading
- Ensure you selected the `dist/` folder, not root
- Run `npm run build` first if dist/ is missing

### Changes not appearing
- Reload extension in chrome://extensions (click ↻)
- If content script: also refresh the Twitter/X page
- If popup: close and reopen the popup

### Build errors
- Run `npm run type-check` to see TypeScript errors
- Check Node.js version (requires 18+)
- Try `rm -rf node_modules && npm install`

### Logs not appearing
- Service worker: Click "service worker" link in chrome://extensions
- Content script: Must be on twitter.com or x.com domain
- Popup: Right-click popup → Inspect (don't use main page DevTools)
