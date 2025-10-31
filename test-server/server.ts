/**
 * Test server for TweetYoink extension development
 * Receives POST requests and logs the tweet data to console
 *
 * Usage:
 *   npm run server          # Start server on port 3000
 *   npm run server:async    # Start server with async response simulation
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';

const PORT = process.env.PORT || 3000;
const ASYNC_COMPLETION_TIME_MS = 30000; // 30 seconds (matches async-server.ts)
const MODE = process.argv.includes('--async') ? 'async' : 'sync';

// Test modes for empty state testing
const TEST_MODE_EMPTY = process.argv.includes('--test-empty'); // Return empty array
const TEST_MODE_NO_TEXT = process.argv.includes('--test-no-text'); // Return only unsupported types

// Store for simulated async requests
const asyncRequests = new Map<string, { status: string; result?: any; error?: any }>();

/**
 * Generate a random request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse JSON body from request
 */
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Handle POST /tweets endpoint
 */
async function handleTweetsPost(req: IncomingMessage, res: ServerResponse) {
  try {
    const tweetData = await parseBody(req);

    console.log('\n========================================');
    console.log('📬 RECEIVED TWEET DATA');
    console.log('========================================');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('\nTweet Data:');
    console.log(JSON.stringify(tweetData, null, 2));
    console.log('========================================\n');

    if (MODE === 'async') {
      // Simulate async processing
      const requestId = generateRequestId();

      // Store initial state
      asyncRequests.set(requestId, { status: 'pending' });

      console.log(`🔄 Simulating async processing for request: ${requestId}`);
      console.log('   Status will change: pending → processing → completed\n');

      // Simulate processing timeline
      setTimeout(() => {
        asyncRequests.set(requestId, { status: 'processing' });
        console.log(`⚙️  Request ${requestId} now PROCESSING`);
      }, 3000);

      setTimeout(() => {
        // Build content items from actual tweet data
        let contentItems = [];

        // Test mode: return empty array
        if (TEST_MODE_EMPTY) {
          console.log('🧪 TEST MODE: Returning empty array');
          contentItems = [];
        }
        // Test mode: return only unsupported types (no text/image)
        else if (TEST_MODE_NO_TEXT) {
          console.log('🧪 TEST MODE: Returning only unsupported types');
          contentItems.push({
            type: 'video',
            content: 'https://example.com/video.mp4',
            metadata: { title: 'Unsupported Video' },
          });
          contentItems.push({
            type: 'audio',
            content: 'https://example.com/audio.mp3',
            metadata: { title: 'Unsupported Audio' },
          });
        }
        // Normal mode: return actual content
        else {
          // Item 1: Author information
          const authorHandle = tweetData.author?.handle || 'unknown';
          const authorDisplay = tweetData.author?.displayName || 'Unknown User';
          const isVerified = tweetData.author?.isVerified ? '✓ Verified' : '';
          contentItems.push({
            type: 'text',
            content: `Author: @${authorHandle} (${authorDisplay}) ${isVerified}`,
            metadata: {
              title: 'Tweet Author',
              timestamp: new Date().toISOString(),
            },
          });

          // Item 2: Tweet content (full text, no truncation)
          const tweetText = tweetData.text || '[No text content]';
          contentItems.push({
            type: 'text',
            content: tweetText,
            metadata: {
              title: 'Tweet Content',
              length: tweetText.length,
            },
          });

          // Item 3: Media - add actual images
          if (tweetData.media && tweetData.media.length > 0) {
            tweetData.media.forEach((mediaItem: any, index: number) => {
              if (mediaItem.type === 'image' && mediaItem.url) {
                contentItems.push({
                  type: 'image',
                  content: mediaItem.url,
                  metadata: {
                    title: mediaItem.altText || `Image ${index + 1}`,
                    altText: mediaItem.altText,
                    index: index,
                  },
                });
              }
            });
          }
        }

        asyncRequests.set(requestId, {
          status: 'completed',
          result: contentItems,
        });
        console.log(`✅ Request ${requestId} COMPLETED with ${contentItems.length} items`);
      }, ASYNC_COMPLETION_TIME_MS);

      // Return async response
      sendJson(res, 200, {
        status: 'pending',
        requestId,
        estimatedDuration: ASYNC_COMPLETION_TIME_MS / 1000, // Convert ms to seconds
      });
    } else {
      // Synchronous response with content items array showing actual tweet data
      let contentItems = [];

      // Test mode: return empty array
      if (TEST_MODE_EMPTY) {
        console.log('🧪 TEST MODE: Returning empty array');
        contentItems = [];
      }
      // Test mode: return only unsupported types (no text/image)
      else if (TEST_MODE_NO_TEXT) {
        console.log('🧪 TEST MODE: Returning only unsupported types');
        contentItems.push({
          type: 'video',
          content: 'https://example.com/video.mp4',
          metadata: { title: 'Unsupported Video' },
        });
        contentItems.push({
          type: 'audio',
          content: 'https://example.com/audio.mp3',
          metadata: { title: 'Unsupported Audio' },
        });
      }
      // Normal mode: return actual content
      else {
        // Item 1: Author information
        const authorHandle = tweetData.author?.handle || 'unknown';
        const authorDisplay = tweetData.author?.displayName || 'Unknown User';
        const isVerified = tweetData.author?.isVerified ? '✓ Verified' : '';
        contentItems.push({
          type: 'text',
          content: `Author: @${authorHandle} (${authorDisplay}) ${isVerified}`,
          metadata: {
            title: 'Tweet Author',
            timestamp: new Date().toISOString(),
          },
        });

        // Item 2: Tweet content (full text, no truncation)
        const tweetText = tweetData.text || '[No text content]';
        contentItems.push({
          type: 'text',
          content: tweetText,
          metadata: {
            title: 'Tweet Content',
            length: tweetText.length,
          },
        });

        // Item 3: Media - add actual images
        if (tweetData.media && tweetData.media.length > 0) {
          tweetData.media.forEach((mediaItem: any, index: number) => {
            if (mediaItem.type === 'image' && mediaItem.url) {
              contentItems.push({
                type: 'image',
                content: mediaItem.url,
                metadata: {
                  title: mediaItem.altText || `Image ${index + 1}`,
                  altText: mediaItem.altText,
                  index: index,
                },
              });
            }
          });
        }
      }

      console.log(`✅ Sync response with ${contentItems.length} items`);
      sendJson(res, 200, {
        status: 'completed',
        result: contentItems,
      });
    }
  } catch (error) {
    console.error('❌ Error processing request:', error);
    sendJson(res, 400, {
      status: 'error',
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse request body',
      },
    });
  }
}

/**
 * Handle POST /status endpoint
 */
async function handleStatusPost(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await parseBody(req);
    const requestId = body.requestId;

    if (!requestId) {
      sendJson(res, 400, {
        status: 'error',
        error: {
          code: 'MISSING_REQUEST_ID',
          message: 'requestId is required in request body',
        },
      });
      return;
    }

    const request = asyncRequests.get(requestId);

    if (!request) {
      sendJson(res, 404, {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: `Request ${requestId} not found`,
        },
      });
      return;
    }

    console.log(`📊 Status check for ${requestId}: ${request.status}`);

    if (request.status === 'completed') {
      sendJson(res, 200, {
        status: 'completed',
        result: request.result,
      });
    } else if (request.status === 'processing') {
      sendJson(res, 200, {
        status: 'processing',
        message: 'Request is being processed',
      });
    } else {
      sendJson(res, 200, {
        status: 'pending',
        message: 'Request is pending',
      });
    }
  } catch (error) {
    console.error('❌ Error processing status request:', error);
    sendJson(res, 400, {
      status: 'error',
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse request body',
      },
    });
  }
}

/**
 * Handle OPTIONS for CORS preflight
 */
function handleOptions(res: ServerResponse) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  });
  res.end();
}

/**
 * Main request handler
 */
const server = createServer((req, res) => {
  const url = req.url || '/';
  const method = req.method || 'GET';

  console.log(`${method} ${url}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  // Route requests
  if (method === 'POST' && url === '/') {
    handleTweetsPost(req, res);
  } else if (method === 'POST' && url === '/status') {
    handleStatusPost(req, res);
  } else {
    sendJson(res, 404, {
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  }
});

server.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     TweetYoink Test Server Started        ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📋 Mode: ${MODE.toUpperCase()}`);
  console.log('\nEndpoints:');
  console.log(`  POST http://localhost:${PORT}/`);
  if (MODE === 'async') {
    console.log(`  POST http://localhost:${PORT}/status`);
  }
  console.log('\nConfigure TweetYoink extension:');
  console.log(`  1. Open extension options`);
  console.log(`  2. Set endpoint URL to: http://localhost:${PORT}/`);
  console.log(`  3. Grant permission for localhost`);
  console.log(`  4. Save configuration`);
  console.log('\nWatching for requests...\n');
});
