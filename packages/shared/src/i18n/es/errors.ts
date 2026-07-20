/**
 * Spanish Error Messages
 * Validation errors, API errors, user-facing error messages
 */
export const errors = {
  // General
  unknownError: 'Error desconocido',
  somethingWentWrong: 'Algo salió mal',
  errorOccurred: 'Ocurrió un error',
  tryAgainLater: 'Intenta de nuevo más tarde',
  contactSupport: 'Contacta a soporte',

  // Validation
  required: 'Este campo es requerido',
  invalidEmail: 'Correo electrónico inválido',
  invalidFormat: 'Formato inválido',
  invalidValue: 'Valor inválido',
  tooShort: 'Demasiado corto',
  tooLong: 'Demasiado largo',
  mustBePositive: 'Debe ser positivo',
  mustBeNegative: 'Debe ser negativo',
  mustBeNumber: 'Debe ser un número',
  mustBeInteger: 'Debe ser un entero',
  mustBeString: 'Debe ser texto',
  mustBeBoolean: 'Debe ser verdadero o falso',
  mustBeDate: 'Debe ser una fecha',
  mustBeInFuture: 'Debe ser una fecha futura',
  mustBeInPast: 'Debe ser una fecha pasada',

  // String validation
  minLength: 'Mínimo {{min}} caracteres',
  maxLength: 'Máximo {{max}} caracteres',
  exactLength: 'Debe tener exactamente {{length}} caracteres',
  alphanumeric: 'Solo caracteres alfanuméricos',
  noSpaces: 'No se permiten espacios',

  // Number validation
  min: 'Mínimo {{min}}',
  max: 'Máximo {{max}}',
  between: 'Debe estar entre {{min}} y {{max}}',
  greaterThan: 'Debe ser mayor que {{value}}',
  lessThan: 'Debe ser menor que {{value}}',

  // File validation
  fileRequired: 'Archivo requerido',
  fileTooLarge: 'Archivo demasiado grande',
  invalidFileType: 'Tipo de archivo inválido',
  maxFileSize: 'Tamaño máximo: {{size}}',
  allowedTypes: 'Tipos permitidos: {{types}}',

  // Authentication
  invalidCredentials: 'Credenciales inválidas',
  accountNotFound: 'Cuenta no encontrada',
  emailAlreadyExists: 'El correo ya está registrado',
  usernameAlreadyExists: 'El nombre de usuario ya existe',
  passwordTooWeak: 'La contraseña es muy débil',
  passwordsDoNotMatch: 'Las contraseñas no coinciden',
  accountDisabled: 'Cuenta deshabilitada',
  accountLocked: 'Cuenta bloqueada',
  sessionExpired: 'Sesión expirada',
  unauthorized: 'No autorizado',
  forbidden: 'Acceso denegado',
  tooManyAttempts: 'Demasiados intentos',

  // Authorization
  noPermission: 'No tienes permiso',
  insufficientPermissions: 'Permisos insuficientes',
  accessDenied: 'Acceso denegado',
  notOwner: 'No eres el propietario',
  notMember: 'No eres miembro',
  roleRequired: 'Se requiere el rol de {{role}}',

  // Not Found
  notFound: 'No encontrado',
  userNotFound: 'Usuario no encontrado',
  transactionNotFound: 'Transacción no encontrada',
  budgetNotFound: 'Presupuesto no encontrado',
  categoryNotFound: 'Categoría no encontrada',
  spaceNotFound: 'Espacio no encontrado',
  resourceNotFound: 'Recurso no encontrado',
  pageNotFound: 'Página no encontrada',

  // Conflict
  alreadyExists: 'Ya existe',
  duplicateEntry: 'Entrada duplicada',
  conflictDetected: 'Conflicto detectado',

  // Business Logic
  insufficientBalance: 'Saldo insuficiente',
  accountInactive: 'Cuenta inactiva',
  transactionPending: 'Transacción pendiente',
  budgetExceeded: 'Presupuesto excedido',
  limitReached: 'Límite alcanzado',
  quotaExceeded: 'Cuota excedida',
  invalidOperation: 'Operación inválida',
  cannotDeleteInUse: 'No se puede eliminar, está en uso',

  // Network
  networkError: 'Error de red',
  connectionLost: 'Conexión perdida',
  timeoutError: 'Tiempo de espera agotado',
  serverError: 'Error del servidor',
  serviceUnavailable: 'Servicio no disponible',
  maintenanceMode: 'Modo de mantenimiento',

  // Data
  dataCorrupted: 'Datos corruptos',
  invalidData: 'Datos inválidos',
  dataMissing: 'Datos faltantes',
  parseError: 'Error al procesar',
  encodingError: 'Error de codificación',

  // Provider Integration
  providerError: 'Error del proveedor',
  connectionFailed: 'Conexión fallida',
  syncFailed: 'Sincronización fallida',
  providerUnavailable: 'Proveedor no disponible',
  invalidToken: 'Token inválido',
  tokenExpired: 'Token expirado',
  apiError: 'Error de API',
  rateLimitExceeded: 'Límite de solicitudes excedido',

  // Specific features
  importFailed: 'Importación fallida',
  exportFailed: 'Exportación fallida',
  uploadFailed: 'Carga fallida',
  downloadFailed: 'Descarga fallida',
  processingFailed: 'Procesamiento fallido',
  calculationError: 'Error de cálculo',

  // Database
  databaseError: 'Error de base de datos',
  queryFailed: 'Consulta fallida',
  connectionError: 'Error de conexión',
  transactionFailed: 'Transacción fallida',
  constraintViolation: 'Violación de restricción',
  foreignKeyViolation: 'Violación de clave foránea',
  uniqueViolation: 'Violación de unicidad',

  // Crypto/ESG
  invalidAddress: 'Dirección inválida',
  invalidNetwork: 'Red inválida',
  esgDataUnavailable: 'Datos ESG no disponibles',
  priceDataUnavailable: 'Datos de precio no disponibles',

  // Generic HTTP
  badRequest: 'Solicitud incorrecta',
  internalServerError: 'Error interno del servidor',
  notImplemented: 'No implementado',

  // User actions
  cannotUndo: 'No se puede deshacer',
  actionFailed: 'Acción fallida',
  saveFailed: 'Guardado fallido',
  deleteFailed: 'Eliminación fallida',
  updateFailed: 'Actualización fallida',
  createFailed: 'Creación fallida',
} as const;
