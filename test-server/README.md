# TweetYoink Test Server

A simple HTTP server for testing the TweetYoink Chrome extension locally during development.

## Features

- **Synchronous Mode**: Returns immediate responses for testing basic POST functionality
- **Async Mode**: Simulates long-running operations with polling for testing async workflows
- **CORS Enabled**: Works with Chrome extension requests from any origin
- **Request Logging**: Logs all received tweet data to console for debugging
- **Custom Headers Support**: Accepts and displays Authorization headers and custom headers

## Quick Start

### 1. Start the Server

**Synchronous Mode** (default):
```bash
npm run server
```

**Async Mode** (simulates long-running processing):
```bash
npm run server:async
```

The server will start on `http://localhost:3000` by default.

### 2. Configure TweetYoink Extension

1. Open Chrome and navigate to the extension
2. Right-click the TweetYoink icon → **Options**
3. Configure the endpoint:
   - **POST Endpoint URL**: `http://localhost:3000/`
   - **Request Timeout**: `30` seconds (or higher for async mode)
   - Enable async polling if using async mode
4. Click **Grant Permission** to allow localhost access
5. Click **Save Configuration**

### 3. Test the Extension

1. Navigate to Twitter/X (https://twitter.com or https://x.com)
2. Find any tweet
3. Click the **Yoink** button
4. Check the terminal where the test server is running to see the logged data

## Server Modes

### Synchronous Mode (`npm run server`)

Returns immediate responses:

```json
{
  "status": "completed",
  "result": {
    "message": "Tweet data received successfully",
    "receivedAt": "2025-10-28T12:34:56.789Z",
    "tweetAuthor": "example_user",
    "tweetText": "This is a sample tweet..."
  }
}
```

### Async Mode (`npm run server:async`)

Simulates long-running operations with 30-second processing time:

**Initial POST Response**:
```json
{
  "status": "pending",
  "requestId": "req_1730123456789_abc123",
  "estimatedDuration": 30
}
```

**Processing Timeline**:
- 0s: Request received → `status: "pending"`
- 0-30s: Polling returns → `status: "processing"` with progress percentage
- 30s+: Polling returns → `status: "completed"` with original tweet data

**Completed Response** (after 30 seconds):
```json
{
  "status": "completed",
  "result": {
    "message": "Tweet processing completed",
    "processedAt": "2025-10-28T12:34:56.789Z",
    "originalData": { /* full tweet data */ },
    "processingDuration": 30
  }
}
```

The extension will automatically poll `POST /status` with `{"requestId": "..."}` in the body every 5 seconds if polling is enabled.

## API Endpoints

### POST /

Receives tweet data from the extension.

**Request**:
```json
{
  "text": "Tweet content...",
  "author": {
    "handle": "username",
    "displayName": "Display Name"
  },
  "timestamp": "2025-10-28T12:34:56.789Z",
  "metrics": {
    "likeCount": 42,
    "retweetCount": 10
  }
}
```

**Response** (sync mode):
```json
{
  "status": "completed",
  "result": { ... }
}
```

**Response** (async mode):
```json
{
  "status": "pending",
  "requestId": "req_xyz123",
  "estimatedDuration": 8
}
```

### POST /status

Check the status of an async request (async mode only).

**Request**:
```json
{
  "requestId": "req_xyz123"
}
```

**Response** (pending):
```json
{
  "status": "pending",
  "message": "Request is pending"
}
```

**Response** (processing):
```json
{
  "status": "processing",
  "requestId": "req_xyz123",
  "progress": 0.45,
  "message": "Processing... 15s remaining"
}
```

**Response** (completed):
```json
{
  "status": "completed",
  "result": {
    "message": "Tweet processing completed",
    "processedAt": "2025-10-28T12:34:56.789Z",
    "originalData": { /* full tweet data */ },
    "processingDuration": 30
  }
}
```

## Testing Custom Headers

The test server displays all received headers in the console. To test custom headers:

1. In TweetYoink options, add a custom header:
   - **Key**: `Authorization`
   - **Value**: `Bearer test_token_123`
   - Check **Sensitive** to mask in extension logs
2. Save configuration
3. Click Yoink on a tweet
4. Check the server console to see the headers

Example console output:
```
Headers: {
  'content-type': 'application/json',
  'authorization': 'Bearer test_token_123',
  'x-api-key': 'my-api-key'
}
```

## Environment Variables

- `PORT`: Server port (default: 3000)

Example:
```bash
PORT=8080 npm run server
```

## Console Output

The server provides detailed logging:

```
╔════════════════════════════════════════════╗
║     TweetYoink Test Server Started        ║
╚════════════════════════════════════════════╝

🚀 Server running on: http://localhost:3000
📋 Mode: SYNC

Endpoints:
  POST http://localhost:3000/

Configure TweetYoink extension:
  1. Open extension options
  2. Set endpoint URL to: http://localhost:3000/
  3. Grant permission for localhost
  4. Save configuration

Watching for requests...

POST /

========================================
📬 RECEIVED TWEET DATA
========================================
Time: 2025-10-28T12:34:56.789Z
Headers: {...}

Tweet Data:
{
  "text": "Example tweet content",
  "author": {...},
  ...
}
========================================
```

## Troubleshooting

### Permission Denied
- Make sure you clicked "Grant Permission" in the extension options
- The extension should show "✓ Permission granted" for localhost

### Timeout Errors
- In async mode, increase the timeout in extension settings (try 60 seconds)
- Check that the server is actually running on the configured port

### CORS Errors
- This shouldn't happen with Chrome extensions, but if it does:
  - Verify the server is running
  - Check the endpoint URL is exactly `http://localhost:3000/`

### No Logs Appearing
- Verify the extension is configured correctly
- Check browser console (F12) for extension errors
- Ensure you're on twitter.com or x.com when clicking Yoink

## Development Notes

- The test server is **NOT** included in the extension build (dist/)
- Server files are in `test-server/` directory
- Server runs via `tsx` for direct TypeScript execution
- No need to build the extension to use the test server
