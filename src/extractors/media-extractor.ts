/**
 * Media extractor for images, videos, and GIFs
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

import type { MediaData } from '../types/tweet-data';

/**
 * Extracts media (images, videos, GIFs) from tweet article element
 * @param tweetArticle - The tweet article element
 * @returns Array of MediaData objects
 */
export function extractMedia(tweetArticle: Element): MediaData[] {
  const media: MediaData[] = [];

  // Extract images
  const images = extractImages(tweetArticle);
  media.push(...images);

  // Extract videos
  const videos = extractVideos(tweetArticle);
  media.push(...videos);

  // Extract GIFs
  const gifs = extractGIFs(tweetArticle);
  media.push(...gifs);

  return media;
}

/**
 * Extracts image media from tweet
 * @param tweetArticle - The tweet article element
 * @returns Array of image MediaData objects
 */
function extractImages(tweetArticle: Element): MediaData[] {
  const images: MediaData[] = [];

  // Primary: data-testid="tweetPhoto" with img elements
  const photoContainers = tweetArticle.querySelectorAll('[data-testid="tweetPhoto"]');

  for (let i = 0; i < photoContainers.length; i++) {
    const container = photoContainers[i];

    // Find img elements within the photo container
    const imgElements = container.querySelectorAll('img');

    for (let j = 0; j < imgElements.length; j++) {
      const img = imgElements[j];
      const src = img.getAttribute('src');
      const alt = img.getAttribute('alt') || null;

      // Skip profile images and other non-tweet media
      if (src && src.includes('media') && !src.includes('profile_images')) {
        images.push({
          type: 'image',
          url: src,
          thumbnailUrl: null,
          altText: alt,
          width: null,
          height: null,
        });
      }
    }
  }

  return images;
}

/**
 * Extracts video media from tweet
 * @param tweetArticle - The tweet article element
 * @returns Array of video MediaData objects
 */
function extractVideos(tweetArticle: Element): MediaData[] {
  const videos: MediaData[] = [];

  // Primary: data-testid="videoPlayer" with video elements
  const videoPlayers = tweetArticle.querySelectorAll('[data-testid="videoPlayer"]');

  for (let i = 0; i < videoPlayers.length; i++) {
    const player = videoPlayers[i];

    // Find video element
    const videoElement = player.querySelector('video');

    if (videoElement) {
      // Extract video source
      const source = videoElement.querySelector('source');
      const url = source?.getAttribute('src') || null;

      // Extract poster/thumbnail
      const posterUrl = videoElement.getAttribute('poster') || null;

      // Extract type
      const type = source?.getAttribute('type') || 'video/mp4';

      if (url) {
        videos.push({
          type: 'video',
          url,
          thumbnailUrl: posterUrl,
          altText: null,
          width: null,
          height: null,
        });
      }
    }
  }

  return videos;
}

/**
 * Extracts GIF media from tweet
 * @param tweetArticle - The tweet article element
 * @returns Array of GIF MediaData objects
 */
function extractGIFs(tweetArticle: Element): MediaData[] {
  const gifs: MediaData[] = [];

  // Primary: data-testid="tweetGif" or videos with "gif" label
  const gifContainers = tweetArticle.querySelectorAll('[data-testid="tweetGif"]');

  for (let i = 0; i < gifContainers.length; i++) {
    const container = gifContainers[i];

    // GIFs are often rendered as video elements with loop
    const videoElement = container.querySelector('video');

    if (videoElement) {
      const source = videoElement.querySelector('source');
      const url = source?.getAttribute('src') || null;
      const posterUrl = videoElement.getAttribute('poster') || null;

      if (url) {
        gifs.push({
          type: 'gif',
          url,
          thumbnailUrl: posterUrl,
          altText: null,
          width: null,
          height: null,
        });
      }
    } else {
      // Fallback: check for img elements (some GIFs might be displayed as images)
      const imgElement = container.querySelector('img');
      if (imgElement) {
        const src = imgElement.getAttribute('src');
        const alt = imgElement.getAttribute('alt') || null;

        if (src) {
          gifs.push({
            type: 'gif',
            url: src,
            thumbnailUrl: null,
            altText: alt,
            width: null,
            height: null,
          });
        }
      }
    }
  }

  return gifs;
}
