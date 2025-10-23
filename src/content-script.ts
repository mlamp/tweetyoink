// TweetYoink Content Script
// Runs on Twitter/X pages to extract tweet data

// Check if we're on Twitter or X domain
const currentDomain = window.location.hostname;
const isTwitter = currentDomain === 'twitter.com' || currentDomain === 'x.com';

if (isTwitter) {
  console.log('[TweetYoink Content Script] Loaded on', window.location.href);
} else {
  console.warn('[TweetYoink Content Script] Not on Twitter/X domain:', currentDomain);
}

// Future: Tweet extraction logic will be added here
// Future: DOM observer for tweet detection
// Future: Capture button injection
