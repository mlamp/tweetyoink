# Test Fixtures

This directory contains test fixtures used across the TweetYoink test suite.

## Files

### `x-tweet-sample.html`

Anonymized X/Twitter tweet HTML for testing DOM extraction logic.

**Source**: Captured from X/Twitter using `outerHTML` on a tweet element
**Anonymization**: Personal information removed (usernames, profile images)
**XPath**: `/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/section/div/div/div[1]/div`
**CSS Selector**: `#react-root > div > div > div.css-175oi2r.r-1f2l425.r-13qz1uu.r-417010.r-18u37iz > main > div > div > div > div.css-175oi2r.r-kemksi.r-1kqtdi0.r-1ua6aaf.r-th6na.r-1phboty.r-16y2uox.r-184en5c.r-1abdc3e.r-1lg4w6u.r-f8sm7e.r-13qz1uu.r-1ye8kvj > div > section > div > div > div:nth-child(1) > div`

**Usage Example**:

```typescript
import * as fs from 'fs';
import * as path from 'path';

// Load fixture HTML
const fixtureHTML = fs.readFileSync(
  path.join(process.cwd(), 'tests/fixtures/x-tweet-sample.html'),
  'utf-8'
);

// Parse using JSDOM or similar
const dom = new JSDOM(fixtureHTML);
const document = dom.window.document;

// Test your extraction logic
const tweetText = document.querySelector('[data-testid="tweetText"]')?.textContent;
const replyCount = document.querySelector('[data-testid="reply"]')?.ariaLabel;
// ... etc
```

**Tweet Structure**:

The fixture contains a complete tweet article with:
- User profile section (avatar, display name, handle, verified badge)
- Tweet content: "Democrat Shutdown Jeopardizes America's Skies"
- Link card to whitehouse.gov
- Timestamp: Oct 23, 2025 at 7:34 PM
- Engagement metrics:
  - 48 replies
  - 152 reposts
  - 553 likes
  - 9 bookmarks
  - 29.9K views
- Interactive buttons (reply, repost, like, bookmark, share)

**Key `data-testid` Attributes**:

- `tweet` - Root article element
- `Tweet-User-Avatar` - User avatar container
- `tweetText` - Tweet text content
- `card.wrapper` - Link card container
- `card.layoutLarge.media` - Card media
- `reply` - Reply button
- `retweet` - Repost button
- `like` - Like button
- `bookmark` - Bookmark button

**Use Cases**:

1. **DOM Extraction Tests**: Validate extractors can parse tweet structure
2. **Selector Testing**: Test XPath and CSS selectors against real HTML
3. **Data Structure Validation**: Ensure extracted data matches TweetData type
4. **Regression Testing**: Detect when X/Twitter changes DOM structure
5. **CI/CD**: Automated testing without requiring live X/Twitter access

### `x-tweet-quote.html`

Anonymized X/Twitter quote tweet HTML for testing quote tweet extraction logic.

**Source**: Captured from X/Twitter using `outerHTML` on a quote tweet element
**Anonymization**: Personal information removed (usernames replaced with TestQuoter and OriginalAuthor, profile images replaced with placeholders)
**Tweet Type**: Quote tweet (user quoting another user's tweet)

**Tweet Structure**:

The fixture contains a complete quote tweet with:
- **Outer tweet** (the quote):
  - User: "Test Quoter" (@TestQuoter)
  - Verified badge
  - Quote text: "This is a quote tweet with additional commentary"
  - Timestamp: Oct 28, 2025 at 11:13 AM
  - Metrics: 2.5K replies, 4.4K reposts, 25K likes, 2.5M views

- **Inner tweet** (the quoted original):
  - User: "Original Author" (@OriginalAuthor)
  - Verified badge
  - Original text: "This is the original quoted tweet content that provides important context and information for the conversation"
  - Media: Image attachment
  - Timestamp: Oct 28, 2025 at 11:10 AM

**Key Features for Testing**:

1. **Nested structure**: Tests ability to extract both quote and quoted tweet
2. **Multiple authors**: Tests distinguishing between quoter and original author
3. **Media in quoted tweet**: Tests media extraction from nested content
4. **Full metrics**: Tests extraction of all engagement metrics
5. **Quote indicator**: Contains visual "Quote" label to identify quote type

**Expected Extraction Pattern**:

```typescript
{
  "text": "This is a quote tweet with additional commentary",
  "author": {
    "handle": "TestQuoter",
    "displayName": "Test Quoter",
    "isVerified": true
  },
  "tweetType": {
    "isQuote": true,
    "isRetweet": false,
    "isReply": false
  },
  "parent": {
    "text": "This is the original quoted tweet content...",
    "author": {
      "handle": "OriginalAuthor",
      "displayName": "Original Author",
      "isVerified": true
    },
    "media": [{ "type": "image", "url": "..." }]
  }
}
```

**Use Cases**:

1. **Quote Tweet Detection**: Test `isQuote` flag extraction
2. **Nested Tweet Extraction**: Validate parent tweet data capture
3. **Author Disambiguation**: Ensure correct author attribution for both tweets
4. **Media in Quotes**: Test media extraction from quoted content
5. **Quote Structure**: Validate nested TweetData in `parent` field

### `x-tweet-quote-video.html`

Anonymized X/Twitter quote tweet HTML with video content for testing quote tweet extraction with media.

**Source**: Captured from X/Twitter using `outerHTML` on a quote tweet element containing video
**Anonymization**: Personal information removed (usernames replaced with QuotingUser and OriginalPoster, profile images and video URLs replaced with placeholders)
**Tweet Type**: Quote tweet with video in quoted tweet

**Tweet Structure**:

The fixture contains a complete quote tweet with video:
- **Outer tweet** (the quote):
  - User: "Quoting User" (@QuotingUser)
  - Verified badge
  - Quote text: "How to share Example.com links"
  - Timestamp: Oct 28, 2025 at 11:08 AM
  - Metrics: 972 replies, 2.3K reposts, 11K likes, 2.1M views

- **Inner tweet** (the quoted original with video):
  - User: "Original Poster" (@OriginalPoster)
  - Verified badge
  - Original text: "How to share Example.com links? Tap any heading, hit the link icon, and your link is copied instantly."
  - Media: Video attachment (data-testid="videoPlayer" and data-testid="tweetPhoto")
  - Video poster image: placeholder video poster
  - Timestamp: Oct 28, 2025 at 7:15 AM

**Key Features for Testing**:

1. **Video in quoted tweet**: Tests video media extraction from nested content
2. **Video-specific selectors**: Tests `data-testid="videoPlayer"` and `data-testid="videoComponent"`
3. **Video poster extraction**: Tests extraction of video thumbnail/poster image
4. **Quote with media**: Validates quote tweet structure when original has video
5. **Full nested structure**: Both outer and inner tweets with all metadata

**Expected Extraction Pattern**:

```typescript
{
  "text": "How to share Example.com links",
  "author": {
    "handle": "QuotingUser",
    "displayName": "Quoting User",
    "isVerified": true
  },
  "tweetType": {
    "isQuote": true,
    "isRetweet": false,
    "isReply": false
  },
  "parent": {
    "text": "How to share Example.com links? Tap any heading...",
    "author": {
      "handle": "OriginalPoster",
      "displayName": "Original Poster",
      "isVerified": true
    },
    "media": [{
      "type": "video",
      "url": "blob:https://x.com/placeholder-video-blob",
      "posterUrl": "https://pbs.twimg.com/amplify_video_thumb/placeholder/video_poster.jpg"
    }]
  }
}
```

**Use Cases**:

1. **Video Detection**: Test video media type detection in quoted tweets
2. **Video Metadata Extraction**: Validate extraction of video URL and poster
3. **Quote with Video**: Test nested extraction when original tweet has video
4. **Media Array Population**: Ensure media array includes video objects correctly
5. **Video Selectors**: Validate `videoPlayer` and `videoComponent` testid selectors

## Adding New Fixtures

When adding new test fixtures:

1. Anonymize all personal information (usernames, images, etc.)
2. Keep representative data structure and content
3. Document the source, selectors, and use case in this README
4. Add usage examples for future reference
