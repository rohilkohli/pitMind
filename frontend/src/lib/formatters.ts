// Centralized formatting utilities for consistent date, time, and number display

/**
 * Format date consistently across the application
 * @param date - Date string, timestamp, or Date object
 * @param format - Format type: 'short' | 'long' | 'time' | 'datetime'
 */
export function formatDate(
  date: string | number | Date,
  format: 'short' | 'long' | 'time' | 'datetime' = 'short'
): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC', // Use UTC for race times (consistent globally)
    };

    switch (format) {
      case 'short':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        break;
      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.hour12 = false;
        break;
      case 'datetime':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.hour12 = false;
        break;
    }

    return new Intl.DateTimeFormat('en-GB', options).format(d);
  } catch (e) {
    console.error('Date formatting error:', e);
    return String(date);
  }
}

/**
 * Format lap time in MM:SS.mmm format
 * @param seconds - Time in seconds
 */
export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--.---';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

/**
 * Format numbers with locale-specific separators
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '--';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format percentage values
 * @param value - Value between 0 and 100
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '--';

  return `${formatNumber(value, decimals)}%`;
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration in human-readable format
 * @param ms - Duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Validate and parse date from localStorage
 * @param dateString - Date string to parse
 * @returns Valid Date object or null
 */
export function parseStoredDate(dateString: string | null): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
