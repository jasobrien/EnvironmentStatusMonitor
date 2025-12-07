/**
 * Application-wide constants
 * Centralized location for magic numbers and commonly used values
 */

// Time periods for uptime statistics (in days)
const UPTIME_PERIODS = {
  ONE_DAY: 1,
  ONE_WEEK: 7,
  ONE_MONTH: 30,
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  ONE_YEAR: 365
};

// Default uptime periods for dashboard display
const DEFAULT_UPTIME_PERIODS = [
  UPTIME_PERIODS.ONE_DAY,
  UPTIME_PERIODS.ONE_WEEK,
  UPTIME_PERIODS.ONE_MONTH
];

// Time constants
const TIME = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// File upload limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: '10mb',
  ALLOWED_EXTENSIONS: ['.json']
};

// RAG Status values
const RAG_STATUS = {
  GREEN: 'Green',
  AMBER: 'Amber',
  RED: 'Red'
};

// Default thresholds (percentage)
const DEFAULT_THRESHOLDS = {
  GREEN: 100,
  AMBER: 90
};

// Auto-refresh intervals (in seconds)
const REFRESH_INTERVALS = {
  DASHBOARD: 90,
  PERFORMANCE: 60,
  RESULTS: 30
};

// Chart configuration defaults
const CHART_DEFAULTS = {
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: true,
  ANIMATION_DURATION: 400,
  TOOLTIP_ENABLED: true
};

// Color schemes for charts
const CHART_COLORS = {
  GREEN: 'rgba(75, 192, 192, 0.8)',
  AMBER: 'rgba(255, 206, 86, 0.8)',
  RED: 'rgba(255, 99, 132, 0.8)',
  BLUE: 'rgba(54, 162, 235, 0.8)',
  PURPLE: 'rgba(153, 102, 255, 0.8)',
  ORANGE: 'rgba(255, 159, 64, 0.8)'
};

// Logging levels
const LOG_LEVELS = {
  INFO: 'Info',
  WARNING: 'Warning',
  ERROR: 'Error',
  DEBUG: 'Debug'
};

// Performance time periods (for dropdown)
const PERFORMANCE_PERIODS = [
  { value: 1, label: '1 Day' },
  { value: 3, label: '3 Days' },
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 'All', label: 'All Time' }
];

// Retry configuration for API calls
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2
};

// Session configuration
const SESSION_CONFIG = {
  COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  COOKIE_SECURE: false, // Set to true in production with HTTPS
  COOKIE_HTTP_ONLY: true,
  COOKIE_SAME_SITE: 'lax'
};

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UPTIME_PERIODS,
    DEFAULT_UPTIME_PERIODS,
    TIME,
    HTTP_STATUS,
    UPLOAD_LIMITS,
    RAG_STATUS,
    DEFAULT_THRESHOLDS,
    REFRESH_INTERVALS,
    CHART_DEFAULTS,
    CHART_COLORS,
    LOG_LEVELS,
    PERFORMANCE_PERIODS,
    RETRY_CONFIG,
    SESSION_CONFIG
  };
}
