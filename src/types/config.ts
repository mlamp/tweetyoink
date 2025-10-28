/**
 * Configuration types for TweetYoink extension
 * Feature: 003-config-endpoint
 */

export interface ExtensionConfig {
  endpointUrl: string;
  pollingIntervalSeconds: number;
  pollingMaxDurationSeconds: number;
  postTimeoutSeconds: number;
  enablePolling: boolean;
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  endpointUrl: '',
  pollingIntervalSeconds: 5,
  pollingMaxDurationSeconds: 300,
  postTimeoutSeconds: 30,
  enablePolling: true,
};

export interface HeaderEntry {
  key: string;
  value: string;
  enabled: boolean;
  sensitive: boolean;
}

export interface CustomHeaders {
  headers: HeaderEntry[];
}

export const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^api-key$/i,
  /^x-api-key$/i,
  /^bearer$/i,
];

export function isSensitiveHeader(key: string): boolean {
  return SENSITIVE_HEADER_PATTERNS.some(pattern => pattern.test(key));
}

export type RequestStatus = 'pending' | 'polling' | 'completed' | 'failed' | 'timeout';

export interface PollableRequest {
  requestId: string;
  tweetId: string;
  startTime: number;
  lastPollTime: number;
  pollCount: number;
  currentIntervalMs: number;
  status: RequestStatus;
  progress?: number;
  message?: string;
  result?: unknown;
  error?: { code: string; message: string };
}

export function createPollableRequest(
  requestId: string,
  tweetId: string,
  initialIntervalMs: number
): PollableRequest {
  const now = Date.now();
  return {
    requestId,
    tweetId,
    startTime: now,
    lastPollTime: now,
    pollCount: 0,
    currentIntervalMs: initialIntervalMs,
    status: 'pending',
  };
}

// Response types from POST endpoint
export type PostResponse =
  | { status: 'completed'; result: unknown }
  | { status: 'pending' | 'processing'; requestId: string; estimatedDuration?: number; message?: string }
  | { status: 'failed' | 'error'; error: { code: string; message: string } };

export function isAsyncResponse(
  response: PostResponse
): response is Extract<PostResponse, { requestId: string }> {
  return 'requestId' in response && (response.status === 'pending' || response.status === 'processing');
}

export function isSynchronousResponse(
  response: PostResponse
): response is Extract<PostResponse, { status: 'completed' }> {
  return response.status === 'completed';
}

export function isErrorResponse(
  response: PostResponse
): response is Extract<PostResponse, { status: 'failed' | 'error' }> {
  return response.status === 'failed' || response.status === 'error';
}

// Polling status response
export type PollingStatus = 'processing' | 'completed' | 'failed';

export interface PollingStatusResponse {
  status: PollingStatus;
  progress?: number;
  message?: string;
  result?: unknown;
  error?: { code: string; message: string };
}
