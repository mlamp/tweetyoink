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

## Adding New Fixtures

When adding new test fixtures:

1. Anonymize all personal information (usernames, images, etc.)
2. Keep representative data structure and content
3. Document the source, selectors, and use case in this README
4. Add usage examples for future reference
