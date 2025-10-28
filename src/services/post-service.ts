/**
 * POST service for sending tweet data to configured endpoint
 * Feature: 003-config-endpoint
 *
 * NOTE: This service sends requests through the service worker because
 * content scripts cannot access chrome.permissions API directly.
 */

import type { PostResponse } from '../types/config';
import type { TweetData } from '../types/tweet-data';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(`HTTP ${status}: ${message}`);
    this.name = 'HttpError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Post tweet data to configured endpoint via service worker
 * Content scripts cannot access chrome.permissions, so we delegate to service worker
 */
export async function postTweetData(tweetData: TweetData): Promise<PostResponse> {
  console.log('[TweetYoink] Sending tweet data via service worker');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'POST_TWEET_DATA',
      tweetData,
    });

    if (response.success) {
      console.log('[TweetYoink] POST successful');
      return response.data;
    } else {
      console.error('[TweetYoink] POST failed:', response.error);

      // Re-throw with appropriate error type
      if (response.errorType === 'HttpError') {
        throw new HttpError(response.status || 500, response.error);
      } else if (response.errorType === 'TimeoutError') {
        throw new TimeoutError(response.error);
      } else if (response.errorType === 'NetworkError') {
        throw new NetworkError(response.error);
      } else {
        throw new Error(response.error);
      }
    }
  } catch (error: any) {
    // If the error is already one of our custom types, re-throw it
    if (error instanceof HttpError || error instanceof TimeoutError || error instanceof NetworkError) {
      throw error;
    }

    // Handle chrome.runtime errors
    console.error('[TweetYoink] Service worker communication error:', error);
    throw new Error(`Failed to communicate with service worker: ${error.message}`);
  }
}
