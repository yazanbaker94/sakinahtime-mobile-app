/**
 * Production-safe logger utility
 * 
 * In development (__DEV__ = true): logs to console
 * In production (__DEV__ = false): no-op (silent)
 * 
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('message');
 *   logger.warn('warning');
 *   logger.error('error');
 */

// Check if we're in development mode
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// No-op function for production
const noop = (..._args: unknown[]) => {};

/**
 * Logger that only outputs in development mode
 */
export const logger = {
  log: isDev ? console.log.bind(console) : noop,
  warn: isDev ? console.warn.bind(console) : noop,
  error: isDev ? console.error.bind(console) : noop,
  info: isDev ? console.info.bind(console) : noop,
  debug: isDev ? console.debug.bind(console) : noop,
};

/**
 * For critical errors that should always be logged (even in production)
 * Use sparingly - only for errors that need investigation
 */
export const criticalLogger = {
  error: console.error.bind(console),
};

export default logger;
