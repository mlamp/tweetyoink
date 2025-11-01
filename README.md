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

## Legal & Ethical Use

### What TweetYoink Does

TweetYoink is a **personal research tool** that extracts publicly visible tweet data from your browser's DOM. It works similarly to taking screenshots or using copy/paste - but provides structured data instead.

**Key Points:**
- ✅ Only captures publicly visible data (what you can already see)
- ✅ Requires explicit user action (clicking "Yoink" button)
- ✅ One tweet at a time (not automated/bulk scraping)
- ✅ Data sent to YOUR configured backend (you control everything)
- ✅ Does not use Twitter's API (no API terms violated)
- ✅ Does not bypass authentication or paywalls

### Intended Use Cases

**Legitimate Uses:**
- 📊 Personal research and data analysis
- 🤖 Creating LLM training datasets for educational purposes
- 📚 Content archival and documentation
- 🔍 Fact-checking and verification workflows
- 📝 Academic research and citation management

**NOT Intended For:**
- ❌ Violating Twitter/X Terms of Service
- ❌ Unauthorized commercial data scraping
- ❌ Mass automated data collection
- ❌ Harassment or malicious monitoring
- ❌ Circumventing platform restrictions

### User Responsibilities

By using TweetYoink, you agree to:

1. **Comply with Platform Terms** - Respect Twitter/X Terms of Service and usage policies
2. **Respect Copyright** - Honor intellectual property rights and fair use principles
3. **Use Ethically** - Do not use for harassment, spam, or malicious purposes
4. **Personal Use** - Intended for individual research, not commercial scraping services
5. **Rate Limiting** - Use responsibly; manual one-click captures only

### Legal Status

**TweetYoink is a neutral tool.** Like a camera, notepad, or web browser, it can be used legally or illegally depending on user actions. The tool itself:

- ✅ Is legal to build, distribute, and use
- ✅ Comparable to screenshot tools, web clippers, and bookmark managers
- ✅ Does not violate any laws by its existence
- ⚠️ Users are responsible for their own compliance with applicable laws and ToS

**The developers of TweetYoink:**
- Do not endorse or encourage ToS violations
- Are not responsible for how users choose to use this tool
- Provide this software "as-is" without warranty (see MIT License)

### Privacy & Data Handling

- 🔒 TweetYoink does not collect, store, or transmit your data anywhere except to YOUR configured backend
- 🔒 No telemetry, tracking, or third-party data sharing
- 🔒 All captured data stays under your control
- 🔒 Open source - you can audit the code yourself

### Disclaimer

**USE AT YOUR OWN RISK.** This tool is provided for educational and research purposes. You are solely responsible for ensuring your use complies with:
- Twitter/X Terms of Service
- Applicable copyright laws
- Data protection regulations (GDPR, CCPA, etc.)
- Any other relevant local, state, or federal laws

If you use TweetYoink in ways that violate platform policies or laws, you do so at your own risk and liability.

## License

MIT

## Version

0.1.0 (Initial Setup)
