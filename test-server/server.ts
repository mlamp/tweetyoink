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
        asyncRequests.set(requestId, {
          status: 'completed',
          result: {
            analysis: 'This is a simulated analysis result',
            sentiment: 'positive',
            keywords: ['test', 'tweet', 'data'],
            processedAt: new Date().toISOString(),
          },
        });
        console.log(`✅ Request ${requestId} COMPLETED`);
      }, ASYNC_COMPLETION_TIME_MS);

      // Return async response
      sendJson(res, 200, {
        status: 'pending',
        requestId,
        estimatedDuration: ASYNC_COMPLETION_TIME_MS / 1000, // Convert ms to seconds
      });
    } else {
      // Synchronous response
      sendJson(res, 200, {
        status: 'completed',
        result: {
          message: 'Tweet data received successfully',
          receivedAt: new Date().toISOString(),
          tweetAuthor: tweetData.author?.handle || 'unknown',
          tweetText: tweetData.text?.substring(0, 50) + '...' || 'no text',
        },
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
