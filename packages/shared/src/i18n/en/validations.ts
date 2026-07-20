/**
 * English Validation Messages
 * Form validation, input requirements
 */
export const validations = {
  // General
  required: '{{field}} is required',
  requiredField: 'This field is required',
  invalid: 'Invalid {{field}}',
  invalidFormat: 'Invalid {{field}} format',

  // Email
  emailRequired: 'Email is required',
  emailInvalid: 'Invalid email',
  emailAlreadyExists: 'Email already registered',
  emailFormat: 'Enter a valid email',

  // Password
  passwordRequired: 'Password is required',
  passwordMinLength: 'Password must be at least {{min}} characters',
  passwordMaxLength: 'Password cannot be more than {{max}} characters',
  passwordUppercase: 'Password must have at least one uppercase letter',
  passwordLowercase: 'Password must have at least one lowercase letter',
  passwordNumber: 'Password must have at least one number',
  passwordSpecialChar: 'Password must have at least one special character',
  passwordsDoNotMatch: 'Passwords do not match',
  passwordTooWeak: 'Password too weak',
  passwordCommon: 'This password is too common',

  // Name
  nameRequired: 'Name is required',
  nameMinLength: 'Name must be at least {{min}} characters',
  nameMaxLength: 'Name cannot be more than {{max}} characters',
  nameInvalid: 'Invalid name',

  // Amount
  amountRequired: 'Amount is required',
  amountInvalid: 'Invalid amount',
  amountPositive: 'Amount must be positive',
  amountNegative: 'Amount must be negative',
  amountMin: 'Minimum amount is {{min}}',
  amountMax: 'Maximum amount is {{max}}',
  amountRange: 'Amount must be between {{min}} and {{max}}',

  // Date
  dateRequired: 'Date is required',
  dateInvalid: 'Invalid date',
  dateFormat: 'Invalid date format',
  dateFuture: 'Date must be in the future',
  datePast: 'Date must be in the past',
  dateMin: 'Minimum date is {{min}}',
  dateMax: 'Maximum date is {{max}}',
  dateRange: 'Date must be between {{min}} and {{max}}',
  startDateRequired: 'Start date is required',
  endDateRequired: 'End date is required',
  endDateAfterStart: 'End date must be after start date',

  // URL
  urlRequired: 'URL is required',
  urlInvalid: 'Invalid URL',
  urlFormat: 'Enter a valid URL',

  // Phone
  phoneRequired: 'Phone is required',
  phoneInvalid: 'Invalid phone number',
  phoneFormat: 'Invalid phone format',

  // String validation
  minLength: 'Must be at least {{min}} characters',
  maxLength: 'Cannot be more than {{max}} characters',
  exactLength: 'Must be exactly {{length}} characters',
  alphanumeric: 'Only alphanumeric characters',
  alphabetic: 'Only letters',
  numeric: 'Only numbers',
  noSpaces: 'No spaces allowed',
  noSpecialChars: 'No special characters allowed',

  // Number validation
  numberRequired: 'Number is required',
  numberInvalid: 'Invalid number',
  numberMin: 'Minimum value is {{min}}',
  numberMax: 'Maximum value is {{max}}',
  numberRange: 'Value must be between {{min}} and {{max}}',
  numberInteger: 'Must be an integer',
  numberDecimal: 'Must be a decimal number',
  numberPositive: 'Must be positive',
  numberNegative: 'Must be negative',

  // File validation
  fileRequired: 'File is required',
  fileInvalid: 'Invalid file',
  fileTooLarge: 'File too large',
  fileMaxSize: 'Maximum size is {{size}}',
  fileType: 'File type not allowed',
  fileAllowedTypes: 'Allowed types: {{types}}',
  fileExtension: 'Invalid file extension',

  // Image validation
  imageRequired: 'Image is required',
  imageInvalid: 'Invalid image',
  imageTooLarge: 'Image too large',
  imageMaxSize: 'Maximum size is {{size}}',
  imageDimensions: 'Invalid dimensions',
  imageMinDimensions: 'Minimum dimensions: {{width}}x{{height}}',
  imageMaxDimensions: 'Maximum dimensions: {{width}}x{{height}}',
  imageAspectRatio: 'Invalid aspect ratio',

  // Selection
  selectionRequired: 'You must select an option',
  selectionInvalid: 'Invalid selection',
  selectAtLeastOne: 'Select at least one option',
  selectAtMost: 'Select at most {{max}} options',

  // Checkbox
  mustAccept: 'You must accept {{field}}',
  mustAgree: 'You must agree',
  termsRequired: 'You must accept the terms and conditions',

  // Account/Transaction specific
  accountRequired: 'Account is required',
  categoryRequired: 'Category is required',
  descriptionRequired: 'Description is required',
  descriptionMinLength: 'Description must be at least {{min}} characters',
  currencyRequired: 'Currency is required',
  budgetRequired: 'Budget is required',
  budgetPositive: 'Budget must be positive',

  // Custom
  unique: '{{field}} already exists',
  duplicate: 'Duplicate {{field}}',
  notFound: '{{field}} not found',
  alreadyExists: '{{field}} already exists',
  inUse: '{{field}} is in use',
  expired: '{{field}} has expired',
  tooShort: 'Too short',
  tooLong: 'Too long',
  tooSmall: 'Too small',
  tooLarge: 'Too large',
  outOfRange: 'Out of range',

  // Generic messages
  pleaseEnter: 'Please enter {{field}}',
  pleaseSelect: 'Please select {{field}}',
  pleaseCheck: 'Please check {{field}}',
  pleaseFix: 'Please fix the errors',
  checkAndTryAgain: 'Check and try again',
} as const;
