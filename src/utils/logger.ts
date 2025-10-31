/**
 * Logging utility with environment-aware behavior
 * Per Constitution Principle VI: Logging Discipline
 *
 * Development mode: All log levels output to console
 * Production mode: Only errors and warnings output to console
 *
 * This ensures clean console in production while preserving critical
 * error/warning visibility for user support and troubleshooting.
 */

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

/**
 * Logger wrapper for all application logging
 * MUST be used instead of direct console.* calls (except in build scripts)
 */
export const logger = {
  /**
   * Debug logging - stripped in production
   * Use for: Verbose debugging information during development
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Warning logging - visible in both dev and production
   * Use for: Non-fatal issues that should be investigated
   * Examples: Selector fallbacks, deprecated API usage, performance concerns
   */
  warn: (...args: any[]) => {
    // Always output warnings (dev + production)
    console.warn(...args);
  },

  /**
   * Error logging - visible in both dev and production
   * Use for: Fatal errors, exceptions, critical failures
   * Examples: Network errors, extraction failures, API errors
   */
  error: (...args: any[]) => {
    // Always output errors (dev + production)
    console.error(...args);
  },

  /**
   * Info logging - stripped in production
   * Use for: Informational messages during development
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Debug logging - stripped in production
   * Use for: Detailed debugging information during development
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
