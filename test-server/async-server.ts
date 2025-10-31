/**
 * Async test server for TweetYoink extension development
 * Simulates async processing with polling
 *
 * Behavior:
 * - POST / returns { status: "pending", requestId: "..." }
 * - POST /status with body { requestId: "..." } returns "pending" for 30 seconds
 * - After 30 seconds, returns the original tweet data
 *
 * Usage:
 *   npm run server:async
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';

const PORT = process.env.PORT || 3000;
const ASYNC_COMPLETION_TIME_MS = 30000; // 30 seconds

interface AsyncRequest {
  requestId: string;
  tweetData: any;
  createdAt: number;
  completedAt: number;
}

// Store for async requests
const asyncRequests = new Map<string, AsyncRequest>();

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
    console.log('📬 RECEIVED TWEET DATA (ASYNC)');
    console.log('========================================');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('\nTweet Data:');
    console.log(JSON.stringify(tweetData, null, 2));
    console.log('========================================\n');

    // Generate request ID
    const requestId = generateRequestId();
    const now = Date.now();

    // Store request with completion time
    asyncRequests.set(requestId, {
      requestId,
      tweetData,
      createdAt: now,
      completedAt: now + ASYNC_COMPLETION_TIME_MS,
    });

    console.log(`🔄 Created async request: ${requestId}`);
    console.log(`⏱️  Will complete at: ${new Date(now + ASYNC_COMPLETION_TIME_MS).toISOString()}`);
    console.log(`📊 Active requests: ${asyncRequests.size}\n`);

    // Clean up old requests (older than 5 minutes)
    const fiveMinutesAgo = now - 300000;
    for (const [id, request] of asyncRequests.entries()) {
      if (request.createdAt < fiveMinutesAgo) {
        asyncRequests.delete(id);
        console.log(`🧹 Cleaned up old request: ${id}`);
      }
    }

    // Return async response
    sendJson(res, 200, {
      status: 'pending',
      requestId,
      estimatedDuration: ASYNC_COMPLETION_TIME_MS / 1000, // Convert ms to seconds
    });
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
      console.log(`❌ Status check for unknown request: ${requestId}`);
      sendJson(res, 404, {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: `Request ${requestId} not found`,
        },
      });
      return;
    }

    const now = Date.now();
    const elapsed = now - request.createdAt;
    const remaining = request.completedAt - now;

    console.log(`📊 Status check for ${requestId}:`);
    console.log(`   Elapsed: ${Math.floor(elapsed / 1000)}s`);
    console.log(`   Remaining: ${Math.floor(remaining / 1000)}s`);

    // Check if request has completed (30 seconds elapsed)
    if (now >= request.completedAt) {
      console.log(`✅ Request ${requestId} COMPLETED - returning tweet data\n`);

      // Return completed response with content items array showing actual tweet data
      const contentItems = [];

      // Item 1: Author information
      const authorHandle = request.tweetData.author?.handle || 'unknown';
      const authorDisplay = request.tweetData.author?.displayName || 'Unknown User';
      const isVerified = request.tweetData.author?.isVerified ? '✓ Verified' : '';
      contentItems.push({
        type: 'text',
        content: `Author: @${authorHandle} (${authorDisplay}) ${isVerified}`,
        metadata: {
          title: 'Tweet Author',
          timestamp: new Date().toISOString(),
          processingDuration: Math.floor((now - request.createdAt) / 1000),
        },
      });

      // Item 2: Tweet content (full text, no truncation)
      const tweetText = request.tweetData.text || '[No text content]';
      contentItems.push({
        type: 'text',
        content: tweetText,
        metadata: {
          title: 'Tweet Content',
          length: tweetText.length,
          processingDuration: Math.floor((now - request.createdAt) / 1000),
        },
      });

      // Item 3: Media - add actual images
      if (request.tweetData.media && request.tweetData.media.length > 0) {
        request.tweetData.media.forEach((mediaItem: any, index: number) => {
          if (mediaItem.type === 'image' && mediaItem.url) {
            contentItems.push({
              type: 'image',
              content: mediaItem.url,
              metadata: {
                title: mediaItem.altText || `Image ${index + 1}`,
                altText: mediaItem.altText,
                index: index,
                processingDuration: Math.floor((now - request.createdAt) / 1000),
              },
            });
          }
        });
      }

      sendJson(res, 200, {
        status: 'completed',
        result: contentItems,
      });

      // Clean up completed request
      asyncRequests.delete(requestId);
      console.log(`🧹 Removed completed request: ${requestId}`);
      console.log(`📊 Active requests: ${asyncRequests.size}\n`);
    } else {
      // Still pending
      const progress = elapsed / 30000;
      console.log(`⏳ Request ${requestId} still pending (${Math.floor(progress * 100)}%)\n`);

      sendJson(res, 200, {
        status: 'processing',
        requestId,
        progress: Math.min(progress, 0.99),
        message: `Processing... ${Math.floor(remaining / 1000)}s remaining`,
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
  console.log('║   TweetYoink Async Test Server Started   ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📋 Mode: ASYNC (30-second processing time)`);
  console.log('\nEndpoints:');
  console.log(`  POST http://localhost:${PORT}/`);
  console.log(`  POST http://localhost:${PORT}/status`);
  console.log('\nBehavior:');
  console.log('  • POST / returns immediately with requestId');
  console.log('  • POST /status with { requestId } returns "processing" for 30 seconds');
  console.log('  • After 30s, status returns original tweet data');
  console.log('\nConfigure TweetYoink extension:');
  console.log(`  1. Open extension options`);
  console.log(`  2. Set endpoint URL to: http://localhost:${PORT}/`);
  console.log(`  3. Enable async polling`);
  console.log(`  4. Set polling interval to 5 seconds`);
  console.log(`  5. Grant permission for localhost`);
  console.log(`  6. Save configuration`);
  console.log('\nWatching for requests...\n');
});
