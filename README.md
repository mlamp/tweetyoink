# TweetYoink

[![CI](https://github.com/mlamp/tweetyoink/actions/workflows/ci.yml/badge.svg)](https://github.com/mlamp/tweetyoink/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/mlamp)

A Chrome extension for capturing tweets from Twitter/X for LLM analysis.

## Description

TweetYoink allows you to capture tweets with complete context (text, author, metrics, timestamps, media) and send them to a configurable backend for analysis by Large Language Models.

## Features

- 📥 Capture tweets with one click
- 🎯 Extract structured data (no screenshots needed)
- 🔒 User privacy first - you control what gets captured
- ⚙️ Configurable backend URL
- 🚀 Built with TypeScript + Vite for fast development

## Support TweetYoink

If you find TweetYoink useful, consider buying me a yoink (that's one coffee in tweet-extraction units)! ☕

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/mlamp)

Your support helps keep the selectors fresh and the fallbacks defensive. Because good code doesn't write itself... yet. 🤖

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Chrome or Chromium-based browser

### Installation

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

### Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Type check
npm run type-check

# Development server with HMR
npm run dev
```

## Project Structure

```
tweetyoink/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── extractors/     # DOM extraction logic
│   ├── popup/          # Extension popup UI
│   ├── content-script.ts
│   └── service-worker.ts
├── public/
│   ├── icons/          # Extension icons
│   └── manifest.json   # Chrome extension manifest
└── dist/               # Build output (load this in Chrome)
```

## Technology Stack

- **TypeScript 5.x** - Type-safe development
- **Vite** - Fast build tool
- **@crxjs/vite-plugin** - Chrome extension support
- **Manifest V3** - Latest Chrome extension standard

## License

MIT

## Version

0.1.0 (Initial Setup)
