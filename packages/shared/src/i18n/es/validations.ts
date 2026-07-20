/**
 * Spanish Validation Messages
 * Form validation, input requirements
 */
export const validations = {
  // General
  required: '{{field}} es requerido',
  requiredField: 'Este campo es requerido',
  invalid: '{{field}} inválido',
  invalidFormat: 'Formato de {{field}} inválido',

  // Email
  emailRequired: 'El correo electrónico es requerido',
  emailInvalid: 'Correo electrónico inválido',
  emailAlreadyExists: 'El correo ya está registrado',
  emailFormat: 'Ingresa un correo electrónico válido',

  // Password
  passwordRequired: 'La contraseña es requerida',
  passwordMinLength: 'La contraseña debe tener al menos {{min}} caracteres',
  passwordMaxLength: 'La contraseña no puede tener más de {{max}} caracteres',
  passwordUppercase: 'La contraseña debe tener al menos una mayúscula',
  passwordLowercase: 'La contraseña debe tener al menos una minúscula',
  passwordNumber: 'La contraseña debe tener al menos un número',
  passwordSpecialChar: 'La contraseña debe tener al menos un carácter especial',
  passwordsDoNotMatch: 'Las contraseñas no coinciden',
  passwordTooWeak: 'La contraseña es muy débil',
  passwordCommon: 'Esta contraseña es muy común',

  // Name
  nameRequired: 'El nombre es requerido',
  nameMinLength: 'El nombre debe tener al menos {{min}} caracteres',
  nameMaxLength: 'El nombre no puede tener más de {{max}} caracteres',
  nameInvalid: 'Nombre inválido',

  // Amount
  amountRequired: 'El monto es requerido',
  amountInvalid: 'Monto inválido',
  amountPositive: 'El monto debe ser positivo',
  amountNegative: 'El monto debe ser negativo',
  amountMin: 'El monto mínimo es {{min}}',
  amountMax: 'El monto máximo es {{max}}',
  amountRange: 'El monto debe estar entre {{min}} y {{max}}',

  // Date
  dateRequired: 'La fecha es requerida',
  dateInvalid: 'Fecha inválida',
  dateFormat: 'Formato de fecha inválido',
  dateFuture: 'La fecha debe ser futura',
  datePast: 'La fecha debe ser pasada',
  dateMin: 'La fecha mínima es {{min}}',
  dateMax: 'La fecha máxima es {{max}}',
  dateRange: 'La fecha debe estar entre {{min}} y {{max}}',
  startDateRequired: 'La fecha de inicio es requerida',
  endDateRequired: 'La fecha de fin es requerida',
  endDateAfterStart: 'La fecha de fin debe ser después de la de inicio',

  // URL
  urlRequired: 'La URL es requerida',
  urlInvalid: 'URL inválida',
  urlFormat: 'Ingresa una URL válida',

  // Phone
  phoneRequired: 'El teléfono es requerido',
  phoneInvalid: 'Número de teléfono inválido',
  phoneFormat: 'Formato de teléfono inválido',

  // String validation
  minLength: 'Debe tener al menos {{min}} caracteres',
  maxLength: 'No puede tener más de {{max}} caracteres',
  exactLength: 'Debe tener exactamente {{length}} caracteres',
  alphanumeric: 'Solo caracteres alfanuméricos',
  alphabetic: 'Solo letras',
  numeric: 'Solo números',
  noSpaces: 'No se permiten espacios',
  noSpecialChars: 'No se permiten caracteres especiales',

  // Number validation
  numberRequired: 'El número es requerido',
  numberInvalid: 'Número inválido',
  numberMin: 'El valor mínimo es {{min}}',
  numberMax: 'El valor máximo es {{max}}',
  numberRange: 'El valor debe estar entre {{min}} y {{max}}',
  numberInteger: 'Debe ser un número entero',
  numberDecimal: 'Debe ser un número decimal',
  numberPositive: 'Debe ser positivo',
  numberNegative: 'Debe ser negativo',

  // File validation
  fileRequired: 'El archivo es requerido',
  fileInvalid: 'Archivo inválido',
  fileTooLarge: 'El archivo es demasiado grande',
  fileMaxSize: 'El tamaño máximo es {{size}}',
  fileType: 'Tipo de archivo no permitido',
  fileAllowedTypes: 'Tipos permitidos: {{types}}',
  fileExtension: 'Extensión de archivo inválida',

  // Image validation
  imageRequired: 'La imagen es requerida',
  imageInvalid: 'Imagen inválida',
  imageTooLarge: 'La imagen es demasiado grande',
  imageMaxSize: 'El tamaño máximo es {{size}}',
  imageDimensions: 'Dimensiones inválidas',
  imageMinDimensions: 'Dimensiones mínimas: {{width}}x{{height}}',
  imageMaxDimensions: 'Dimensiones máximas: {{width}}x{{height}}',
  imageAspectRatio: 'Relación de aspecto inválida',

  // Selection
  selectionRequired: 'Debes seleccionar una opción',
  selectionInvalid: 'Selección inválida',
  selectAtLeastOne: 'Selecciona al menos una opción',
  selectAtMost: 'Selecciona máximo {{max}} opciones',

  // Checkbox
  mustAccept: 'Debes aceptar {{field}}',
  mustAgree: 'Debes estar de acuerdo',
  termsRequired: 'Debes aceptar los términos y condiciones',

  // Account/Transaction specific
  accountRequired: 'La cuenta es requerida',
  categoryRequired: 'La categoría es requerida',
  descriptionRequired: 'La descripción es requerida',
  descriptionMinLength: 'La descripción debe tener al menos {{min}} caracteres',
  currencyRequired: 'La moneda es requerida',
  budgetRequired: 'El presupuesto es requerido',
  budgetPositive: 'El presupuesto debe ser positivo',

  // Custom
  unique: '{{field}} ya existe',
  duplicate: '{{field}} duplicado',
  notFound: '{{field}} no encontrado',
  alreadyExists: '{{field}} ya existe',
  inUse: '{{field}} está en uso',
  expired: '{{field}} ha expirado',
  tooShort: 'Demasiado corto',
  tooLong: 'Demasiado largo',
  tooSmall: 'Demasiado pequeño',
  tooLarge: 'Demasiado grande',
  outOfRange: 'Fuera de rango',

  // Generic messages
  pleaseEnter: 'Por favor ingresa {{field}}',
  pleaseSelect: 'Por favor selecciona {{field}}',
  pleaseCheck: 'Por favor verifica {{field}}',
  pleaseFix: 'Por favor corrige los errores',
  checkAndTryAgain: 'Verifica e intenta de nuevo',
} as const;
