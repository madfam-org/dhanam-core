/**
 * English Error Messages
 * Validation errors, API errors, user-facing error messages
 */
export const errors = {
  // General
  unknownError: 'Unknown error',
  somethingWentWrong: 'Something went wrong',
  errorOccurred: 'An error occurred',
  tryAgainLater: 'Try again later',
  contactSupport: 'Contact support',

  // Validation
  required: 'This field is required',
  invalidEmail: 'Invalid email',
  invalidFormat: 'Invalid format',
  invalidValue: 'Invalid value',
  tooShort: 'Too short',
  tooLong: 'Too long',
  mustBePositive: 'Must be positive',
  mustBeNegative: 'Must be negative',
  mustBeNumber: 'Must be a number',
  mustBeInteger: 'Must be an integer',
  mustBeString: 'Must be a string',
  mustBeBoolean: 'Must be true or false',
  mustBeDate: 'Must be a date',
  mustBeInFuture: 'Must be a future date',
  mustBeInPast: 'Must be a past date',

  // String validation
  minLength: 'Minimum {{min}} characters',
  maxLength: 'Maximum {{max}} characters',
  exactLength: 'Must be exactly {{length}} characters',
  alphanumeric: 'Only alphanumeric characters',
  noSpaces: 'No spaces allowed',

  // Number validation
  min: 'Minimum {{min}}',
  max: 'Maximum {{max}}',
  between: 'Must be between {{min}} and {{max}}',
  greaterThan: 'Must be greater than {{value}}',
  lessThan: 'Must be less than {{value}}',

  // File validation
  fileRequired: 'File required',
  fileTooLarge: 'File too large',
  invalidFileType: 'Invalid file type',
  maxFileSize: 'Maximum size: {{size}}',
  allowedTypes: 'Allowed types: {{types}}',

  // Authentication
  invalidCredentials: 'Invalid credentials',
  accountNotFound: 'Account not found',
  emailAlreadyExists: 'Email already registered',
  usernameAlreadyExists: 'Username already exists',
  passwordTooWeak: 'Password too weak',
  passwordsDoNotMatch: 'Passwords do not match',
  accountDisabled: 'Account disabled',
  accountLocked: 'Account locked',
  sessionExpired: 'Session expired',
  unauthorized: 'Unauthorized',
  forbidden: 'Access denied',
  tooManyAttempts: 'Too many attempts',

  // Authorization
  noPermission: 'You do not have permission',
  insufficientPermissions: 'Insufficient permissions',
  accessDenied: 'Access denied',
  notOwner: 'You are not the owner',
  notMember: 'You are not a member',
  roleRequired: 'Role {{role}} required',

  // Not Found
  notFound: 'Not found',
  userNotFound: 'User not found',
  transactionNotFound: 'Transaction not found',
  budgetNotFound: 'Budget not found',
  categoryNotFound: 'Category not found',
  spaceNotFound: 'Space not found',
  resourceNotFound: 'Resource not found',
  pageNotFound: 'Page not found',

  // Conflict
  alreadyExists: 'Already exists',
  duplicateEntry: 'Duplicate entry',
  conflictDetected: 'Conflict detected',

  // Business Logic
  insufficientBalance: 'Insufficient balance',
  accountInactive: 'Account inactive',
  transactionPending: 'Transaction pending',
  budgetExceeded: 'Budget exceeded',
  limitReached: 'Limit reached',
  quotaExceeded: 'Quota exceeded',
  invalidOperation: 'Invalid operation',
  cannotDeleteInUse: 'Cannot delete, in use',

  // Network
  networkError: 'Network error',
  connectionLost: 'Connection lost',
  timeoutError: 'Timeout error',
  serverError: 'Server error',
  serviceUnavailable: 'Service unavailable',
  maintenanceMode: 'Maintenance mode',

  // Data
  dataCorrupted: 'Data corrupted',
  invalidData: 'Invalid data',
  dataMissing: 'Data missing',
  parseError: 'Parse error',
  encodingError: 'Encoding error',

  // Provider Integration
  providerError: 'Provider error',
  connectionFailed: 'Connection failed',
  syncFailed: 'Sync failed',
  providerUnavailable: 'Provider unavailable',
  invalidToken: 'Invalid token',
  tokenExpired: 'Token expired',
  apiError: 'API error',
  rateLimitExceeded: 'Rate limit exceeded',

  // Specific features
  importFailed: 'Import failed',
  exportFailed: 'Export failed',
  uploadFailed: 'Upload failed',
  downloadFailed: 'Download failed',
  processingFailed: 'Processing failed',
  calculationError: 'Calculation error',

  // Database
  databaseError: 'Database error',
  queryFailed: 'Query failed',
  connectionError: 'Connection error',
  transactionFailed: 'Transaction failed',
  constraintViolation: 'Constraint violation',
  foreignKeyViolation: 'Foreign key violation',
  uniqueViolation: 'Unique violation',

  // Crypto/ESG
  invalidAddress: 'Invalid address',
  invalidNetwork: 'Invalid network',
  esgDataUnavailable: 'ESG data unavailable',
  priceDataUnavailable: 'Price data unavailable',

  // Generic HTTP
  badRequest: 'Bad request',
  internalServerError: 'Internal server error',
  notImplemented: 'Not implemented',

  // User actions
  cannotUndo: 'Cannot undo',
  actionFailed: 'Action failed',
  saveFailed: 'Save failed',
  deleteFailed: 'Delete failed',
  updateFailed: 'Update failed',
  createFailed: 'Create failed',
} as const;
