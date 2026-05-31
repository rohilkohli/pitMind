// Application-wide constants to eliminate magic numbers

// ── TIME CONSTANTS ────────────────────────────────────────────────
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// ── WEBSOCKET CONFIGURATION ───────────────────────────────────────
export const WEBSOCKET = {
  MAX_RETRIES: 5,
  INITIAL_BACKOFF_MS: 1000,
  MAX_BACKOFF_MS: 16000,
  HEARTBEAT_INTERVAL_MS: 30000,
  CONNECTION_TIMEOUT_MS: 10000,
  MESSAGE_QUEUE_SIZE: 100,
} as const;

// ── API CONFIGURATION ─────────────────────────────────────────────
export const API = {
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  RATE_LIMIT_PER_MINUTE: 60,
} as const;

// ── UI BREAKPOINTS ────────────────────────────────────────────────
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
  WIDE: 1920,
} as const;

// ── LAYOUT DIMENSIONS ─────────────────────────────────────────────
export const LAYOUT = {
  TOPBAR_HEIGHT: 52,
  SIDEBAR_WIDTH: 280,
  PANEL_MIN_WIDTH: 250,
  PANEL_MIN_HEIGHT: 200,
  RESIZE_HANDLE_WIDTH: 2,
  MOBILE_NAV_HEIGHT: 60,
} as const;

// ── ANIMATION TIMINGS ─────────────────────────────────────────────
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// ── Z-INDEX LAYERS ────────────────────────────────────────────────
export const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 1000,
  STICKY: 1100,
  FIXED: 1200,
  MODAL_BACKDROP: 1300,
  MODAL: 1400,
  POPOVER: 1500,
  TOOLTIP: 1600,
  NOTIFICATION: 1700,
  CURSOR: 9990,
  SCANLINE: 9990,
  OFFLINE_BANNER: 99999,
} as const;

// ── STORAGE KEYS ──────────────────────────────────────────────────
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'pitmind_user_prefs',
  PANEL_STATE: 'pitmind_panel_state',
  COLUMN_ORDER: 'pitmind_column_order',
  THEME: 'pitmind_theme',
  RECENT_SEARCHES: 'pitmind_recent_searches',
  TELEMETRY_CACHE: 'pitmind_telemetry_cache',
} as const;

// ── FILE UPLOAD ───────────────────────────────────────────────────
export const UPLOAD = {
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ['.csv', '.json'],
  ALLOWED_MIME_TYPES: ['text/csv', 'application/json'],
} as const;

// ── CHART CONFIGURATION ───────────────────────────────────────────
export const CHART = {
  DEFAULT_HEIGHT: 300,
  MOBILE_HEIGHT: 200,
  MAX_DATA_POINTS: 1000,
  ANIMATION_DURATION: 300,
  TOOLTIP_DELAY_MS: 100,
} as const;

// ── PERFORMANCE THRESHOLDS ────────────────────────────────────────
export const PERFORMANCE = {
  DEBOUNCE_MS: 300,
  THROTTLE_MS: 100,
  VIRTUAL_SCROLL_THRESHOLD: 100,
  LAZY_LOAD_OFFSET: 200,
  IMAGE_QUALITY: 0.85,
} as const;

// ── VALIDATION ────────────────────────────────────────────────────
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_MESSAGE_LENGTH: 5000,
  MAX_FILE_NAME_LENGTH: 255,
  MIN_LAP_TIME_SECONDS: 30,
  MAX_LAP_TIME_SECONDS: 300,
} as const;

// ── TYRE COMPOUNDS ────────────────────────────────────────────────
export const TYRE_COMPOUNDS = {
  SOFT: { color: '#e8002d', label: 'SOFT' },
  MEDIUM: { color: '#ffc906', label: 'MEDIUM' },
  HARD: { color: '#ffffff', label: 'HARD' },
  INTERMEDIATE: { color: '#39b54a', label: 'INTER' },
  WET: { color: '#0067ff', label: 'WET' },
} as const;

// ── CONFIDENCE THRESHOLDS ─────────────────────────────────────────
export const CONFIDENCE = {
  VERY_LOW: 40,
  LOW: 60,
  MEDIUM: 75,
  HIGH: 85,
  VERY_HIGH: 95,
} as const;

// ── NOTIFICATION TYPES ────────────────────────────────────────────
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  NORMAL: 5000,
  LONG: 8000,
  PERSISTENT: 0, // Must be dismissed manually
} as const;

// ── ROLE TYPES ────────────────────────────────────────────────────
export const ROLES = {
  ENGINEER: 'engineer',
  STRATEGIST: 'strategist',
  FAN: 'fan',
} as const;

// ── ERROR CODES ───────────────────────────────────────────────────
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
} as const;
