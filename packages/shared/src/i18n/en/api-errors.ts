export const apiErrors = {
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
  AUTH_ACCOUNT_LOCKED:
    'Your account has been locked due to multiple failed login attempts. Please reset your password or contact support.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_TOKEN_INVALID: 'Invalid authentication token. Please log in again.',
  AUTH_TOKEN_EXPIRED: 'Authentication token has expired. Please log in again.',
  AUTH_TOTP_REQUIRED: 'Two-factor authentication code is required.',
  AUTH_TOTP_INVALID: 'Invalid two-factor authentication code.',
  AUTH_TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later.',
  VALIDATION_FAILED: 'Validation failed. Please check your input.',
  VALIDATION_REQUIRED_FIELD: 'This field is required.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  RESOURCE_ALREADY_EXISTS: 'A resource with this identifier already exists.',
  RESOURCE_IN_USE: 'This resource is currently in use and cannot be deleted.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to access this resource.',
  PROVIDER_ERROR: 'An error occurred with the financial provider. Please try again.',
  PROVIDER_UNAVAILABLE: 'The financial provider is currently unavailable. Please try again later.',
  PROVIDER_SYNC_FAILED: 'Failed to sync data from the financial provider.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  INTERNAL_ERROR: 'An internal error occurred. Please contact support if this persists.',
  DATABASE_ERROR: 'A database error occurred. Please try again.',
  BUDGET_EXCEEDED: 'This transaction would exceed your budget limit.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  ACCOUNT_INACTIVE: 'This account is inactive and cannot perform transactions.',
  FEATURE_NOT_AVAILABLE: 'This feature is not available on your current plan.',
  FILE_TOO_LARGE: 'The file is too large. Maximum size is {{maxSize}}.',
  INVALID_FILE_TYPE: 'Invalid file type. Allowed types: {{allowedTypes}}.',

  // Connection health: rate limit
  CONN_RATE_LIMIT_TITLE: 'Sync Temporarily Paused',
  CONN_RATE_LIMIT_MESSAGE:
    "We've made too many requests to {{provider}} in a short time. This is normal and will resolve automatically.",
  CONN_RATE_LIMIT_ACTION: 'Wait a few minutes before trying again.',
  CONN_RATE_LIMIT_BUTTON: 'Retry Sync',

  // Connection health: authentication
  CONN_AUTH_TITLE: 'Reconnection Required',
  CONN_AUTH_MESSAGE:
    'Your connection to {{provider}} needs to be refreshed. This happens periodically for security.',
  CONN_AUTH_ACTION:
    'Please reconnect your account to continue syncing. Your transaction history will be preserved.',
  CONN_AUTH_BUTTON: 'Reconnect Account',

  // Connection health: connection error
  CONN_CONNECTION_TITLE: 'Connection Issue',
  CONN_CONNECTION_MESSAGE:
    "We're having trouble reaching {{provider}}. This is usually a temporary network issue.",
  CONN_CONNECTION_ACTION: 'Check your internet connection and try again in a few minutes.',
  CONN_CONNECTION_BUTTON: 'Retry',

  // Connection health: timeout
  CONN_TIMEOUT_TITLE: 'Sync Taking Longer Than Expected',
  CONN_TIMEOUT_MESSAGE: '{{provider}} is taking longer than usual to respond. Your data is safe.',
  CONN_TIMEOUT_ACTION: "We'll automatically retry. You can also try again manually.",
  CONN_TIMEOUT_BUTTON: 'Retry Sync',

  // Connection health: maintenance
  CONN_MAINTENANCE_TITLE: 'Scheduled Maintenance',
  CONN_MAINTENANCE_MESSAGE:
    '{{provider}} is undergoing maintenance. Syncing will resume automatically when complete.',
  CONN_MAINTENANCE_ACTION: "No action needed. We'll sync your data when the service is back.",
  CONN_MAINTENANCE_BUTTON: 'Check Status',

  // Connection health: institution error
  CONN_INSTITUTION_TITLE: 'Bank Connection Issue',
  CONN_INSTITUTION_MESSAGE:
    'Your bank or institution is experiencing technical difficulties. This is on their end, not yours.',
  CONN_INSTITUTION_ACTION:
    'Wait for the institution to resolve the issue. You can try reconnecting if the problem persists.',
  CONN_INSTITUTION_BUTTON: 'View Status',

  // Connection health: default error
  CONN_DEFAULT_TITLE: 'Sync Issue',
  CONN_DEFAULT_MESSAGE: 'We encountered an issue syncing with {{provider}}.',
  CONN_DEFAULT_ACTION: 'Try refreshing the connection. If the issue persists, contact support.',
  CONN_DEFAULT_BUTTON: 'Retry',

  // Connection health: summary messages
  CONN_SUMMARY_ALL_HEALTHY: 'All accounts are syncing normally.',
  CONN_SUMMARY_REAUTH: '{{count}} account(s) need reconnection.',
  CONN_SUMMARY_ERRORS: '{{count}} account(s) have sync errors.',
  CONN_SUMMARY_DEGRADED: '{{count}} account(s) are experiencing delays.',
  CONN_SUMMARY_MIXED: '{{reauth}} reconnection(s), {{errors}} error(s), {{degraded}} delay(s).',

  // Connection health: status text (summary endpoint)
  CONN_STATUS_ALL_HEALTHY: 'All connections healthy',
  CONN_STATUS_NEED_ATTENTION: '{{count}} connection(s) need attention',
  CONN_STATUS_DEGRADED: '{{count}} connection(s) degraded',

  // Sync status UI
  SYNC_STATUS_TITLE: 'Data Sync Status',
  SYNC_STATUS_LAST_UPDATED: 'Last updated {{time}}',
  SYNC_STATUS_NEXT_SYNC: 'Next sync {{time}}',
  SYNC_STATUS_SYNC_NOW: 'Sync Now',
  SYNC_STATUS_ACCOUNT_CONNECTIONS: 'Account Connections',
  SYNC_STATUS_LAST_SYNC: 'Last sync {{time}}',
  SYNC_STATUS_CONNECTED: 'Connected',
  SYNC_STATUS_SYNCING: 'Syncing',
  SYNC_STATUS_ERROR: 'Error',
  SYNC_STATUS_UNKNOWN: 'Unknown',
  SYNC_STATUS_RECONNECT: 'Reconnect',
  SYNC_STATUS_CONNECTED_COUNT: 'Connected',
  SYNC_STATUS_NEED_ATTENTION: 'Need Attention',
  SYNC_STATUS_SYNCING_COUNT: 'Syncing',
} as const;
