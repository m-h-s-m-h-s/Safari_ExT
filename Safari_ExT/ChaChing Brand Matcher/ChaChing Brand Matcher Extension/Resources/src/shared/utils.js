/**
 * utils.js - Utility functions for the Chaching Product Searcher Extension
 * 
 * This module provides common utility functions used throughout the extension
 * for text processing, URL generation, and data validation.
 * 
 * @module utils
 * @author Chaching Product Searcher Extension
 * @version 1.0.0
 */

// A configuration object for shared constants and settings.
const CONFIG = {
  // The base URL for making searches on the ChaChing website.
  CHACHING_BASE_URL: 'https://chaching.me/us/search',
  // The duration in milliseconds for how long a notification should be visible.
  NOTIFICATION_DURATION: 5000,
  // The default delay in milliseconds for debouncing functions.
  DEBOUNCE_DELAY: 300,
  // The maximum allowed length for a product title.
  MAX_TITLE_LENGTH: 200,
  // The minimum allowed length for a product title.
  MIN_TITLE_LENGTH: 3
};

/**
 * Sanitizes a product title for use in URL parameters.
 * It removes special characters and extra spaces, and converts spaces to plus signs.
 * 
 * @param {string} title - The raw product title to sanitize.
 * @returns {string} The sanitized title suitable for a URL query parameter.
 */
function sanitizeProductTitle(title) {
  // Check if the input is a valid, non-empty string.
  if (!title || typeof title !== 'string') {
    // Log a warning and return an empty string if the input is invalid.
    console.warn('[Utils] Invalid title provided to sanitizeProductTitle:', title);
    return '';
  }

  // Chain several string replacement and trimming operations.
  return title
    .replace(/<[^>]*>/g, '')           // Remove any HTML tags.
    .replace(/[^\w\s\-\.']/g, ' ')      // Remove characters that are not words, spaces, dashes, periods, or apostrophes.
    .replace(/\s+/g, ' ')             // Collapse multiple whitespace characters into a single space.
    .trim()                           // Remove leading and trailing whitespace.
    .replace(/\s/g, '+');             // Replace all remaining spaces with plus signs.
}

/**
 * Generates a ChaChing search URL for a given product title.
 * 
 * @param {string} productTitle - The product title to search for.
 * @returns {string} The complete ChaChing search URL.
 */
function generateChachingUrl(productTitle) {
  // Sanitize the product title first to make it URL-safe.
  const sanitizedTitle = sanitizeProductTitle(productTitle);
  
  // If the sanitized title is empty, log an error and return the base URL.
  if (!sanitizedTitle) {
    console.error('[Utils] Failed to generate URL: Invalid product title');
    return CONFIG.CHACHING_BASE_URL;
  }

  // Construct the full search URL.
  // The query is not URI-encoded here to preserve the '+' signs, which servers often interpret as spaces.
  return `${CONFIG.CHACHING_BASE_URL}?query=${sanitizedTitle}`;
}

/**
 * Validates if a string is a valid product title based on its length.
 * 
 * @param {string} title - The title to validate.
 * @returns {boolean} True if the title is valid, false otherwise.
 */
function isValidProductTitle(title) {
  // Ensure the title is a non-empty string.
  if (!title || typeof title !== 'string') {
    return false;
  }

  // Trim whitespace from the title.
  const trimmedTitle = title.trim();
  // Check if the length of the trimmed title is within the configured min and max bounds.
  return trimmedTitle.length >= CONFIG.MIN_TITLE_LENGTH && 
         trimmedTitle.length <= CONFIG.MAX_TITLE_LENGTH;
}

/**
 * Creates a debounced version of a function that delays its execution.
 * This is useful for preventing a function from being called too frequently, such as on every keystroke.
 * 
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds. Defaults to DEBOUNCE_DELAY.
 * @returns {Function} The new debounced function.
 */
function debounce(func, delay = CONFIG.DEBOUNCE_DELAY) {
  // A variable to hold the timer ID.
  let timeoutId;
  
  // Return a new function that will be the debounced version.
  return function debounced(...args) {
    // `this` and `args` are preserved from the original call.
    const context = this;
    
    // Clear any existing timer.
    clearTimeout(timeoutId);
    // Set a new timer.
    timeoutId = setTimeout(() => {
      // When the timer fires, execute the original function.
      func.apply(context, args);
    }, delay);
  };
}

/**
 * Extracts the main domain name from a full URL (e.g., "amazon" from "https://www.amazon.com/product/123").
 * 
 * @param {string} url - The URL to extract the domain from.
 * @returns {string} The domain name, or an empty string if invalid.
 */
function extractDomain(url) {
  // Use a try-catch block in case the URL is malformed.
  try {
    // Create a URL object to easily parse the URL.
    const urlObj = new URL(url);
    // Get the hostname (e.g., "www.amazon.com").
    const hostname = urlObj.hostname;
    
    // Remove the "www." prefix if it exists.
    const domain = hostname.replace(/^www\./, '');
    
    // Split the domain by the dot and return the second-to-last part.
    const parts = domain.split('.');
    return parts.length > 1 ? parts[parts.length - 2] : parts[0];
  } catch (error) {
    // If an error occurs, log it and return an empty string.
    console.error('[Utils] Failed to extract domain:', error);
    return '';
  }
}

/**
 * A standardized logging function for the extension.
 * 
 * @param {string} level - The log level ('info', 'warn', 'error').
 * @param {string} module - The name of the module where the log originates.
 * @param {string} message - The message to log.
 * @param {*} [data] - Optional additional data to log with the message.
 */
function log(level, module, message, data) {
  // Get the current timestamp in ISO format.
  const timestamp = new Date().toISOString();
  // Create a consistent prefix for all log messages.
  const prefix = `[${timestamp}] [${module}]`;
  
  // Use a switch statement to call the appropriate console method.
  switch (level) {
    case 'info':
      console.log(`${prefix} ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`, data || '');
      break;
    case 'error':
      console.error(`${prefix} ${message}`, data || '');
      break;
    default:
      console.log(`${prefix} ${message}`, data || '');
  }
}

/**
 * Creates a throttled version of a function that will only be called at most once per specified time limit.
 * 
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The time limit in milliseconds.
 * @returns {Function} The new throttled function.
 */
function throttle(func, limit) {
  // A flag to track if we are currently in the "throttled" state.
  let inThrottle;
  // A variable to store the result of the last successful call.
  let lastResult;
  
  // Return the new throttled function.
  return function throttled(...args) {
    const context = this;
    
    // If we are not currently throttled...
    if (!inThrottle) {
      // Set the flag to true.
      inThrottle = true;
      // Execute the original function and store its result.
      lastResult = func.apply(context, args);
      
      // Set a timer to reset the throttle flag after the limit has passed.
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    // Return the result of the last execution.
    return lastResult;
  };
}

/**
 * Normalizes a brand name for consistent, case-insensitive comparison.
 * It converts the string to lowercase and removes all common special characters,
 * symbols, and whitespace to create a canonical key for matching.
 * e.g., "Levi's®", "levi-strauss", and "Levi Strauss" would all be normalized
 * to a similar base for comparison.
 *
 * @param {string} brandName - The raw brand name.
 * @returns {string} The normalized brand name.
 */
function normalizeBrand(brandName) {
  // Ensure the brand name is a valid string.
  if (!brandName || typeof brandName !== 'string') return '';
  // Chain several replacement and trimming operations for normalization.
  return brandName
    .toLowerCase()
    .replace(/[''®™&©\-\.,]/g, '') // Remove common symbols and punctuation.
    .replace(/\s+/g, '')          // Remove all whitespace.
    .trim();                      // Trim any remaining whitespace from the ends.
}

// Make the utility functions and config available on the global `window` object
// so they can be easily accessed by all other content scripts.
if (typeof window !== 'undefined') {
  window.ChachingUtils = {
    CONFIG,
    sanitizeProductTitle,
    generateChachingUrl,
    isValidProductTitle,
    debounce,
    throttle,
    extractDomain,
    log,
    normalizeBrand
  };
} 