// Debounce and throttle utilities for performance optimization

/**
 * Debounce function calls to prevent excessive executions
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function calls to limit execution frequency
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Rate limit function calls (allows N calls per time window)
 * @param func - Function to rate limit
 * @param maxCalls - Maximum calls allowed
 * @param timeWindow - Time window in milliseconds
 * @returns Rate limited function
 */
export function rateLimit<T extends (...args: unknown[]) => unknown>(
  func: T,
  maxCalls: number,
  timeWindow: number
): (...args: Parameters<T>) => void {
  const calls: number[] = [];

  return function rateLimited(...args: Parameters<T>) {
    const now = Date.now();

    // Remove old calls outside the time window
    while (calls.length > 0 && calls[0] < now - timeWindow) {
      calls.shift();
    }

    if (calls.length < maxCalls) {
      calls.push(now);
      func(...args);
    } else {
      console.warn('Rate limit exceeded');
    }
  };
}
