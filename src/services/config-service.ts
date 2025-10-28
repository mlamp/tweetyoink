/**
 * Configuration service for TweetYoink extension
 * Feature: 003-config-endpoint
 * Manages settings storage, validation, and retrieval
 */

import type { ExtensionConfig, CustomHeaders } from '../types/config';
import { DEFAULT_CONFIG, MIN_POLLING_INTERVAL_SECONDS } from '../types/config';

const CONFIG_KEY = 'tweetyoink-config';
const HEADERS_KEY = 'tweetyoink-custom-headers';

/**
 * Get current configuration with defaults
 */
export async function getConfig(): Promise<ExtensionConfig> {
  const result = await chrome.storage.sync.get(CONFIG_KEY);
  return result[CONFIG_KEY] || DEFAULT_CONFIG;
}

/**
 * Save configuration updates
 * @throws Error if validation fails
 */
export async function saveConfig(config: Partial<ExtensionConfig>): Promise<void> {
  const current = await getConfig();
  const updated = { ...current, ...config };

  // Validate
  const errors = validateConfig(updated);
  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join(', ')}`);
  }

  await chrome.storage.sync.set({ [CONFIG_KEY]: updated });
}

/**
 * Get custom headers configuration
 */
export async function getCustomHeaders(): Promise<CustomHeaders> {
  const result = await chrome.storage.local.get(HEADERS_KEY);
  return result[HEADERS_KEY] || { headers: [] };
}

/**
 * Save custom headers
 */
export async function saveCustomHeaders(headers: CustomHeaders): Promise<void> {
  await chrome.storage.local.set({ [HEADERS_KEY]: headers });
}

/**
 * Validate configuration
 * @returns Array of error messages (empty if valid)
 */
export function validateConfig(config: ExtensionConfig): string[] {
  const errors: string[] = [];

  if (config.endpointUrl && config.endpointUrl !== '') {
    try {
      const url = new URL(config.endpointUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.push('Endpoint URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('Endpoint URL is not a valid URL');
    }
  }

  if (config.pollingIntervalSeconds < MIN_POLLING_INTERVAL_SECONDS) {
    errors.push(`Polling interval must be at least ${MIN_POLLING_INTERVAL_SECONDS} seconds`);
  }

  if (config.pollingMaxDurationSeconds < 60) {
    errors.push('Polling max duration must be at least 60 seconds');
  }

  if (config.postTimeoutSeconds < 5 || config.postTimeoutSeconds > 120) {
    errors.push('POST timeout must be between 5 and 120 seconds');
  }

  return errors;
}

/**
 * Watch for configuration changes
 * @param callback Called when config changes
 */
export function watchConfigChanges(callback: (config: ExtensionConfig) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes[CONFIG_KEY]) {
      callback(changes[CONFIG_KEY].newValue);
    }
  });
}
