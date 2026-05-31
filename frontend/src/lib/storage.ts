// Safe localStorage/sessionStorage wrapper with validation and error handling

const STORAGE_VERSION = '1.0';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for safety

interface StorageItem<T> {
  version: string;
  timestamp: number;
  data: T;
}

/**
 * Safely get item from localStorage with validation
 * @param key - Storage key
 * @param fallback - Fallback value if parse fails
 * @returns Parsed value or fallback
 */
export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;

    const parsed = JSON.parse(item) as StorageItem<T>;

    // Validate structure
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
      console.warn(`Invalid storage structure for key: ${key}`);
      return fallback;
    }

    // Check version compatibility (optional)
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch for key: ${key}`);
      // Could migrate data here in future
    }

    return parsed.data;
  } catch (e) {
    console.error(`Failed to read from localStorage (${key}):`, e);
    return fallback;
  }
}

/**
 * Safely set item to localStorage with size checking
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success boolean
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    const item: StorageItem<T> = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data: value,
    };

    const serialized = JSON.stringify(item);

    // Check size
    if (serialized.length > MAX_STORAGE_SIZE) {
      console.error(`Storage item too large (${key}): ${serialized.length} bytes`);
      return false;
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Clearing old items...');
      clearOldStorageItems();

      // Retry once after clearing
      try {
        const item: StorageItem<T> = {
          version: STORAGE_VERSION,
          timestamp: Date.now(),
          data: value,
        };
        localStorage.setItem(key, JSON.stringify(item));
        return true;
      } catch {
        return false;
      }
    }
    console.error(`Failed to write to localStorage (${key}):`, e);
    return false;
  }
}

/**
 * Remove item from localStorage
 * @param key - Storage key
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Failed to remove from localStorage (${key}):`, e);
  }
}

/**
 * Clear old items from localStorage (older than 7 days)
 */
export function clearOldStorageItems(): void {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  try {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        const parsed = JSON.parse(item) as StorageItem<unknown>;
        if (parsed.timestamp && parsed.timestamp < sevenDaysAgo) {
          localStorage.removeItem(key);
          console.log(`Cleared old storage item: ${key}`);
        }
      } catch {
        // Skip items that don't match our format
      }
    });
  } catch (e) {
    console.error('Failed to clear old storage items:', e);
  }
}

/**
 * Get current localStorage usage
 * @returns Usage in bytes
 */
export function getStorageUsage(): number {
  let total = 0;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        total += key.length + item.length;
      }
    });
  } catch (e) {
    console.error('Failed to calculate storage usage:', e);
  }

  return total;
}

/**
 * Check if localStorage is available
 * @returns Boolean indicating availability
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Session storage helpers (same pattern, smaller size limit)
const MAX_SESSION_SIZE = 1 * 1024 * 1024; // 1MB for session storage

export function getSessionItem<T>(key: string, fallback: T): T {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return fallback;

    const parsed = JSON.parse(item) as StorageItem<T>;
    return parsed.data ?? fallback;
  } catch (e) {
    console.error(`Failed to read from sessionStorage (${key}):`, e);
    return fallback;
  }
}

export function setSessionItem<T>(key: string, value: T): boolean {
  try {
    const item: StorageItem<T> = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data: value,
    };

    const serialized = JSON.stringify(item);

    if (serialized.length > MAX_SESSION_SIZE) {
      console.error(`Session item too large (${key}): ${serialized.length} bytes`);
      return false;
    }

    sessionStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error(`Failed to write to sessionStorage (${key}):`, e);
    return false;
  }
}
