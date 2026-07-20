export const apiErrors = {
  AUTH_INVALID_CREDENTIALS: 'Correo electrónico o contraseña incorrectos',
  AUTH_ACCOUNT_LOCKED:
    'Tu cuenta ha sido bloqueada por seguridad. Por favor verifica tu correo para desbloquearla',
  AUTH_SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente',
  AUTH_TOKEN_INVALID: 'Token de autenticación inválido',
  AUTH_TOKEN_EXPIRED: 'El token de autenticación ha expirado',
  AUTH_TOTP_REQUIRED: 'Se requiere código de autenticación de dos factores',
  AUTH_TOTP_INVALID: 'Código de autenticación inválido o expirado',
  AUTH_TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Por favor intenta más tarde',
  VALIDATION_FAILED: 'Error de validación. Por favor verifica los datos ingresados',
  VALIDATION_REQUIRED_FIELD: 'Este campo es obligatorio',
  RESOURCE_NOT_FOUND: 'El recurso solicitado no existe',
  RESOURCE_ALREADY_EXISTS: 'Este recurso ya existe',
  RESOURCE_IN_USE: 'Este recurso está siendo utilizado y no puede eliminarse',
  PERMISSION_DENIED: 'No tienes permiso para realizar esta acción',
  INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes para acceder a este recurso',
  PROVIDER_ERROR: 'Error al conectar con el proveedor financiero',
  PROVIDER_UNAVAILABLE: 'El proveedor financiero no está disponible temporalmente',
  PROVIDER_SYNC_FAILED: 'Error al sincronizar datos del proveedor',
  RATE_LIMIT_EXCEEDED: 'Has excedido el límite de solicitudes. Por favor intenta más tarde',
  INTERNAL_ERROR: 'Error interno del servidor. Nuestro equipo ha sido notificado',
  DATABASE_ERROR: 'Error de base de datos. Por favor intenta nuevamente',
  BUDGET_EXCEEDED: 'Has excedido el límite de tu presupuesto',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  ACCOUNT_INACTIVE: 'Esta cuenta está inactiva',
  FEATURE_NOT_AVAILABLE: 'Esta función no está disponible en tu plan actual',
  FILE_TOO_LARGE: 'El archivo es demasiado grande. Tamaño máximo permitido: {{maxSize}}',
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido. Formatos aceptados: {{allowedTypes}}',

  // Connection health: rate limit
  CONN_RATE_LIMIT_TITLE: 'Sincronización pausada temporalmente',
  CONN_RATE_LIMIT_MESSAGE:
    'Hemos realizado demasiadas solicitudes a {{provider}} en poco tiempo. Esto es normal y se resolverá automáticamente.',
  CONN_RATE_LIMIT_ACTION: 'Espera unos minutos antes de intentar nuevamente.',
  CONN_RATE_LIMIT_BUTTON: 'Reintentar sincronización',

  // Connection health: authentication
  CONN_AUTH_TITLE: 'Reconexión requerida',
  CONN_AUTH_MESSAGE:
    'Tu conexión con {{provider}} necesita actualizarse. Esto ocurre periódicamente por seguridad.',
  CONN_AUTH_ACTION:
    'Por favor reconecta tu cuenta para continuar sincronizando. Tu historial de transacciones se conservará.',
  CONN_AUTH_BUTTON: 'Reconectar cuenta',

  // Connection health: connection error
  CONN_CONNECTION_TITLE: 'Problema de conexión',
  CONN_CONNECTION_MESSAGE:
    'Estamos teniendo problemas para conectar con {{provider}}. Generalmente es un problema temporal de red.',
  CONN_CONNECTION_ACTION: 'Verifica tu conexión a internet e intenta nuevamente en unos minutos.',
  CONN_CONNECTION_BUTTON: 'Reintentar',

  // Connection health: timeout
  CONN_TIMEOUT_TITLE: 'La sincronización tarda más de lo esperado',
  CONN_TIMEOUT_MESSAGE:
    '{{provider}} está tardando más de lo usual en responder. Tus datos están seguros.',
  CONN_TIMEOUT_ACTION: 'Reintentaremos automáticamente. También puedes intentar manualmente.',
  CONN_TIMEOUT_BUTTON: 'Reintentar sincronización',

  // Connection health: maintenance
  CONN_MAINTENANCE_TITLE: 'Mantenimiento programado',
  CONN_MAINTENANCE_MESSAGE:
    '{{provider}} está en mantenimiento. La sincronización se reanudará automáticamente al finalizar.',
  CONN_MAINTENANCE_ACTION:
    'No se requiere acción. Sincronizaremos tus datos cuando el servicio vuelva.',
  CONN_MAINTENANCE_BUTTON: 'Ver estado',

  // Connection health: institution error
  CONN_INSTITUTION_TITLE: 'Problema con la institución bancaria',
  CONN_INSTITUTION_MESSAGE:
    'Tu banco o institución está experimentando dificultades técnicas. El problema es de ellos, no tuyo.',
  CONN_INSTITUTION_ACTION:
    'Espera a que la institución resuelva el problema. Puedes intentar reconectar si el problema persiste.',
  CONN_INSTITUTION_BUTTON: 'Ver estado',

  // Connection health: default error
  CONN_DEFAULT_TITLE: 'Problema de sincronización',
  CONN_DEFAULT_MESSAGE: 'Encontramos un problema al sincronizar con {{provider}}.',
  CONN_DEFAULT_ACTION: 'Intenta actualizar la conexión. Si el problema persiste, contacta soporte.',
  CONN_DEFAULT_BUTTON: 'Reintentar',

  // Connection health: summary messages
  CONN_SUMMARY_ALL_HEALTHY: 'Todas las cuentas se están sincronizando normalmente.',
  CONN_SUMMARY_REAUTH: '{{count}} cuenta(s) necesitan reconexión.',
  CONN_SUMMARY_ERRORS: '{{count}} cuenta(s) tienen errores de sincronización.',
  CONN_SUMMARY_DEGRADED: '{{count}} cuenta(s) están experimentando retrasos.',
  CONN_SUMMARY_MIXED: '{{reauth}} reconexión(es), {{errors}} error(es), {{degraded}} retraso(s).',

  // Connection health: status text (summary endpoint)
  CONN_STATUS_ALL_HEALTHY: 'Todas las conexiones saludables',
  CONN_STATUS_NEED_ATTENTION: '{{count}} conexión(es) necesitan atención',
  CONN_STATUS_DEGRADED: '{{count}} conexión(es) degradadas',

  // Sync status UI
  SYNC_STATUS_TITLE: 'Estado de sincronización',
  SYNC_STATUS_LAST_UPDATED: 'Última actualización {{time}}',
  SYNC_STATUS_NEXT_SYNC: 'Próxima sincronización {{time}}',
  SYNC_STATUS_SYNC_NOW: 'Sincronizar ahora',
  SYNC_STATUS_ACCOUNT_CONNECTIONS: 'Conexiones de cuentas',
  SYNC_STATUS_LAST_SYNC: 'Última sincronización {{time}}',
  SYNC_STATUS_CONNECTED: 'Conectado',
  SYNC_STATUS_SYNCING: 'Sincronizando',
  SYNC_STATUS_ERROR: 'Error',
  SYNC_STATUS_UNKNOWN: 'Desconocido',
  SYNC_STATUS_RECONNECT: 'Reconectar',
  SYNC_STATUS_CONNECTED_COUNT: 'Conectados',
  SYNC_STATUS_NEED_ATTENTION: 'Necesitan atención',
  SYNC_STATUS_SYNCING_COUNT: 'Sincronizando',
} as const;
