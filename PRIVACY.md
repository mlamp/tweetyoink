# Privacy Policy for TweetYoink

**Last Updated:** November 1, 2025

## Overview

TweetYoink is a Chrome extension that captures publicly visible tweet data from Twitter/X and sends it to a user-configured backend for analysis. This privacy policy explains what data TweetYoink collects, how it's used, and your control over it.

## What Data We Collect

### Data Collected by the Extension

1. **User Configuration Data** (stored locally on your device):
   - Backend URL (the server where you want to send captured tweets)
   - Optional API credentials (if your backend requires authentication)
   - Extension settings and preferences

2. **Tweet Content Data** (captured when you click "Yoink"):
   - Tweet text and author information
   - Engagement metrics (likes, retweets, replies, views)
   - Timestamps and URLs
   - Media references (image/video URLs, not the media files themselves)
   - Retweet/quote tweet context (if applicable)

### Data We DO NOT Collect

- ❌ Personal browsing history
- ❌ Twitter/X passwords or authentication tokens
- ❌ Personal identifiable information (PII) beyond what's in public tweets
- ❌ Location data
- ❌ Usage analytics or telemetry
- ❌ Any data from websites other than Twitter/X

## How We Use Your Data

### User Configuration Data
- **Purpose:** To connect to your chosen backend server
- **Storage:** Stored locally in Chrome's sync storage (syncs across your Chrome browsers if signed in)
- **Access:** Only accessible by the TweetYoink extension on your device
- **Sharing:** Never shared with anyone

### Tweet Content Data
- **Purpose:** Sent to your configured backend for your own analysis purposes
- **Processing:** The extension extracts tweet data from the page DOM and sends it via HTTP POST to your backend
- **Storage by Extension:** Not stored by the extension (sent immediately and discarded)
- **Storage by Your Backend:** Your backend controls what happens to the data - we have no access to or control over your backend
- **Sharing:** Only sent to your configured backend URL - nowhere else

## Your Data, Your Control

- **You choose where data goes:** You configure the backend URL - TweetYoink only sends data where you tell it to
- **You control what's captured:** Data is only captured when you explicitly click the "Yoink" button
- **You can delete configuration:** Remove the extension or clear settings to delete all locally stored configuration
- **No third-party access:** The extension developers have no access to your data or your backend

## Data Retention

- **Configuration data:** Retained in Chrome sync storage until you uninstall the extension or clear settings
- **Tweet data:** Not retained by the extension (sent to your backend and immediately discarded)
- **Logs:** No persistent logs are kept by the extension

## Third-Party Data Sharing

**TweetYoink does not share data with any third parties.**

- Your backend URL is your own server or service (you control it)
- No analytics services
- No advertising networks
- No data brokers
- No telemetry

## Security

- **Local storage:** Configuration data is stored using Chrome's secure storage API
- **Transmission:** Data is sent to your backend via HTTPS (if you configure an HTTPS URL)
- **No external dependencies:** Extension does not load external scripts or resources
- **Open source:** You can audit the code at https://github.com/mlamp/tweetyoink

## Children's Privacy

TweetYoink is not directed to children under 13. We do not knowingly collect data from children. If you are under 13, please do not use this extension.

## Your Rights (GDPR, CCPA, etc.)

Since TweetYoink does not collect or store data on our servers, your data rights are exercised directly:

- **Right to access:** View your configuration in the extension settings
- **Right to deletion:** Uninstall the extension or clear settings
- **Right to data portability:** Your backend has your captured data (not us)
- **Right to object:** Simply don't use the extension

We cannot provide data subject access requests because we don't have your data - you do.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Changes will be posted to:
- This file in the GitHub repository
- The Chrome Web Store listing

The "Last Updated" date at the top will be changed when we make updates.

## Contact

If you have questions about this privacy policy or TweetYoink's data practices:

- **GitHub Issues:** https://github.com/mlamp/tweetyoink/issues
- **Email:** [Your email from Chrome Web Store account]

## Transparency

TweetYoink is open source software:
- **Source code:** https://github.com/mlamp/tweetyoink
- **License:** MIT License
- **Audit the code:** You can verify exactly what the extension does

---

## Summary (TL;DR)

✅ You control everything - TweetYoink sends data only to YOUR backend
✅ No tracking, analytics, or telemetry
✅ Configuration stored locally on your device
✅ Open source - you can audit the code
✅ No third-party data sharing
✅ No PII collection beyond public tweet content

**We don't have your data. You do.** 🔒
