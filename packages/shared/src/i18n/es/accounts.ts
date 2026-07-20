/**
 * Spanish Accounts Translations
 * Financial accounts, connections, sync
 */
export const accounts = {
  // Main
  accounts: 'Cuentas',
  account: 'Cuenta',
  myAccounts: 'Mis cuentas',
  addAccount: 'Agregar cuenta',
  newAccount: 'Nueva cuenta',
  editAccount: 'Editar cuenta',
  deleteAccount: 'Eliminar cuenta',
  accountDetails: 'Detalles de cuenta',
  manualAccount: 'Cuenta manual',
  connectedAccount: 'Cuenta conectada',

  // Types
  checking: 'Cuenta corriente',
  savings: 'Cuenta de ahorro',
  credit: 'Tarjeta de crédito',
  investment: 'Inversión',
  loan: 'Préstamo',
  mortgage: 'Hipoteca',
  crypto: 'Criptomonedas',
  cash: 'Efectivo',
  other: 'Otro',

  // Providers
  providerLabel: 'Proveedor',
  manual: 'Manual',
  belvo: 'Belvo',
  plaid: 'Plaid',
  bitso: 'Bitso',
  connected: 'Conectado',
  disconnected: 'Desconectado',

  // Fields
  accountName: 'Nombre de cuenta',
  accountTypeLabel: 'Tipo de cuenta',
  accountNumber: 'Número de cuenta',
  lastFourDigits: 'Últimos 4 dígitos',
  routingNumber: 'Número de routing',
  institution: 'Institución',
  balance: 'Saldo',
  availableBalance: 'Saldo disponible',
  currentBalance: 'Saldo actual',
  creditLimit: 'Límite de crédito',
  currency: 'Moneda',
  lastSynced: 'Última sincronización',
  status: 'Estado',

  // Status
  active: 'Activa',
  inactive: 'Inactiva',
  syncing: 'Sincronizando',
  syncFailed: 'Sincronización fallida',
  needsReauth: 'Requiere reautenticación',
  closed: 'Cerrada',

  // Actions
  connectAccount: 'Conectar cuenta',
  reconnect: 'Reconectar',
  disconnect: 'Desconectar',
  refreshBalance: 'Actualizar saldo',
  syncNow: 'Sincronizar ahora',
  updateBalance: 'Actualizar saldo',
  viewTransactions: 'Ver transacciones',
  hideAccount: 'Ocultar cuenta',
  showAccount: 'Mostrar cuenta',

  // Connection
  selectInstitution: 'Seleccionar institución',
  searchInstitutions: 'Buscar instituciones',
  popularInstitutions: 'Instituciones populares',
  allInstitutions: 'Todas las instituciones',
  enterCredentials: 'Ingresa tus credenciales',
  authorizingConnection: 'Autorizando conexión',
  connectionSuccessful: 'Conexión exitosa',
  connectionFailed: 'Conexión fallida',
  retryConnection: 'Reintentar conexión',

  // Sync
  syncInProgress: 'Sincronización en progreso',
  syncCompleted: 'Sincronización completada',
  lastSyncedAt: 'Última sincronización: {{time}}',
  neverSynced: 'Nunca sincronizado',
  autoSync: 'Sincronización automática',
  enableAutoSync: 'Habilitar sincronización automática',
  syncFrequency: 'Frecuencia de sincronización',
  syncEveryHour: 'Cada hora',
  syncDaily: 'Diariamente',
  syncWeekly: 'Semanalmente',

  // Balance
  totalBalance: 'Saldo total',
  netWorth: 'Patrimonio neto',
  assets: 'Activos',
  liabilities: 'Pasivos',
  positiveBalance: 'Saldo positivo',
  negativeBalance: 'Saldo negativo',
  balanceHistory: 'Historial de saldo',

  // Messages
  noAccounts: 'No tienes cuentas',
  addFirstAccount: 'Agrega tu primera cuenta',
  accountCreated: 'Cuenta creada',
  accountUpdated: 'Cuenta actualizada',
  accountDeleted: 'Cuenta eliminada',
  accountConnected: 'Cuenta conectada',
  accountDisconnected: 'Cuenta desconectada',
  balanceUpdated: 'Saldo actualizado',

  // Warnings
  accountInactive: 'Esta cuenta está inactiva',
  syncRequired: 'Se requiere sincronización',
  reauthRequired: 'Se requiere reautenticación',
  providerIssue: 'Problema con el proveedor',
  staleData: 'Datos desactualizados',

  // Errors
  accountNotFound: 'Cuenta no encontrada',
  institutionNotFound: 'Institución no encontrada',
  invalidAccountNumber: 'Número de cuenta inválido',
  connectionError: 'Error de conexión',
  authenticationFailed: 'Autenticación fallida',
  insufficientPermissions: 'Permisos insuficientes',
  providerError: 'Error del proveedor',
  accountNameRequired: 'El nombre de la cuenta es requerido',
  accountTypeRequired: 'El tipo de cuenta es requerido',
  balanceRequired: 'El saldo es requerido',
  currencyRequired: 'La moneda es requerida',

  // Confirmation
  confirmDelete: '¿Eliminar esta cuenta?',
  deleteWarning: 'Esto también eliminará todas las transacciones asociadas',
  confirmDisconnect: '¿Desconectar esta cuenta?',
  disconnectWarning: 'Tendrás que volver a autenticarte para reconectar',

  // Page-level keys
  page: {
    title: 'Cuentas',
    description: 'Conecta tus cuentas bancarias y administra tus finanzas',
  },
  provider: {
    belvo: 'Belvo (México)',
    plaid: 'Plaid (EE.UU.)',
    bitso: 'Bitso (Cripto)',
    manual: 'Entrada Manual',
  },
  button: {
    addAccount: 'Agregar Cuenta',
    addManually: 'Agregar Manualmente',
    createAccount: 'Crear Cuenta',
  },
  action: {
    delete: 'Eliminar',
  },
  dialog: {
    addAccount: {
      title: 'Agregar Cuenta',
      description: 'Conecta tu cuenta bancaria o agrega una manualmente',
      connectProvider: 'Conectar con Proveedor',
      or: 'O',
    },
    createManual: {
      title: 'Crear Cuenta Manual',
      description: 'Agrega una cuenta que actualizarás manualmente',
    },
  },
  form: {
    accountName: 'Nombre de la Cuenta',
    accountNamePlaceholder: 'ej., Cuenta Corriente BBVA',
    accountType: 'Tipo de Cuenta',
    selectAccountType: 'Selecciona tipo de cuenta',
    currency: 'Moneda',
    selectCurrency: 'Selecciona moneda',
    currentBalance: 'Saldo Actual',
  },
  accountType: {
    checking: 'Cuenta Corriente',
    savings: 'Ahorro',
    credit: 'Tarjeta de Crédito',
    investment: 'Inversión',
    crypto: 'Cripto',
    other: 'Otro',
  },
  card: {
    lastUpdated: 'Última actualización:',
  },
  empty: {
    title: 'Sin cuentas aún',
    description: 'Conecta tus cuentas bancarias para comenzar a rastrear tus finanzas',
    addFirst: 'Agrega Tu Primera Cuenta',
  },
  toast: {
    connectSuccess: 'Cuenta conectada exitosamente',
    connectFailed: 'Error al conectar cuenta',
    createSuccess: 'Cuenta creada exitosamente',
    createFailed: 'Error al crear cuenta',
    deleteSuccess: 'Cuenta eliminada exitosamente',
    deleteFailed: 'Error al eliminar cuenta',
  },

  // Provider connection dialogs
  providers: {
    // Belvo
    belvo: {
      title: 'Conectar cuenta bancaria mexicana',
      description:
        'Conecta de forma segura tu cuenta bancaria mexicana usando Belvo. Tus credenciales están encriptadas y solo se usan para obtener tus datos financieros.',
      securityTitle: 'Seguridad bancaria',
      securityEncryption: 'Encriptación AES de 256 bits para credenciales',
      securityReadOnly: 'Acceso de solo lectura a tus cuentas',
      securityRegulated: 'Acceso regulado por la CNBV',
      securityKms: 'Credenciales encriptadas con AWS KMS',
      supportedBanks: 'Bancos mexicanos soportados',
      moreInstitutions: 'Y más de 40 instituciones financieras mexicanas',
      usernameLabel: 'Usuario / ID de cliente',
      usernamePlaceholder: 'Tu usuario de banca en línea',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Tu contraseña de banca en línea',
      readOnlyNotice:
        'Solo accederemos a tus saldos e historial de transacciones. No se pueden realizar transferencias o pagos a través de esta conexión.',
      connecting: 'Conectando...',
      connectButton: 'Conectar cuenta bancaria',
      privacyConsent: 'Al conectar, aceptas la',
      linkedSuccess: 'Se vinculó exitosamente {{count}} cuenta de {{bank}}',
      linkedSuccess_plural: 'Se vincularon exitosamente {{count}} cuentas de {{bank}}',
      invalidCredentials: 'Usuario o contraseña inválidos',
      institutionError: 'El banco no está disponible temporalmente',
      mfaRequired: 'Tu banco requiere un token de un solo uso para completar la conexión',
      mfaTitle: 'Verificación de dos factores',
      mfaDescription:
        'Tu banco te envió un token de un solo uso (SMS, app o dispositivo físico). Ingrésalo abajo para terminar de conectar tu cuenta.',
      tokenLabel: 'Token de un solo uso',
      tokenPlaceholder: 'Ingresa el token de tu banco',
      verifying: 'Verificando...',
      verifyButton: 'Verificar y conectar',
      mfaFailed: 'La verificación del token falló. Intenta conectar de nuevo.',
      mfaBack: 'Regresar',
      linkFailed: 'Error al conectar cuenta bancaria',
    },
    // Plaid
    plaid: {
      title: 'Conectar cuenta bancaria de EE.UU.',
      description:
        'Conecta de forma segura tu cuenta bancaria de EE.UU. usando Plaid. Tus credenciales están encriptadas y nunca se almacenan en nuestros servidores.',
      securityTitle: 'Seguridad bancaria',
      securityEncryption: 'Encriptación SSL de 256 bits',
      securityReadOnly: 'Acceso de solo lectura a tus cuentas',
      securityTrusted: 'Usado por miles de aplicaciones financieras',
      securityNoPasswords: 'No se almacenan contraseñas',
      supportedBanks: 'Bancos y cooperativas de crédito soportados',
      moreInstitutions: 'Y más de 10,000 instituciones financieras de EE.UU.',
      initializing: 'Inicializando...',
      connecting: 'Conectando...',
      connectButton: 'Conectar cuenta bancaria',
      privacyConsent: 'Al conectar, aceptas la',
      initFailed: 'Error al inicializar Plaid Link',
      linkedSuccess: 'Se vinculó exitosamente {{count}} cuenta',
      linkedSuccess_plural: 'Se vincularon exitosamente {{count}} cuentas',
      linkFailed: 'Error al vincular cuenta',
      exitError: 'Error al conectar cuenta bancaria',
    },
    // Bitso
    bitso: {
      title: 'Conectar cuenta de Bitso',
      description:
        'Conecta tu cuenta de Bitso para rastrear automáticamente tu portafolio de criptomonedas',
      securityNotice: 'Tus credenciales de API están encriptadas y seguras.',
      securityDetail:
        'Usamos encriptación de nivel bancario y nunca almacenamos tus credenciales en texto plano.',
      howToGetCredentials: 'Cómo obtener tus credenciales de API de Bitso',
      step1Title: 'Inicia sesión en Bitso',
      step1Description: 'e inicia sesión en tu cuenta',
      step2Title: 'Navega a Configuración de API',
      step2Description: 'Ve a Configuración → API → Crear Nueva Clave API',
      step3Title: 'Configura permisos',
      step3Description: 'Habilita solo el permiso de Vista (acceso de solo lectura)',
      step4Title: 'Copia tus credenciales',
      step4Description: 'Copia tu Clave API y Secreto (¡solo verás el secreto una vez!)',
      permissionsWarning:
        'Solo habilita permisos de "Vista". Nunca otorgues permisos de trading a aplicaciones de terceros.',
      supportedCryptos: 'Criptomonedas soportadas',
      haveCredentials: 'Tengo mis credenciales de API',
      cancel: 'Cancelar',
      apiKeyLabel: 'Clave API',
      apiKeyPlaceholder: 'Tu Clave API de Bitso',
      apiSecretLabel: 'Secreto API',
      apiSecretPlaceholder: 'Tu Secreto API de Bitso',
      enableAutoSync: 'Habilitar sincronización automática del portafolio',
      encryptionNotice: 'Tus credenciales serán encriptadas con AES-256 antes de almacenarse.',
      connecting: 'Conectando...',
      connectButton: 'Conectar cuenta de Bitso',
      back: 'Volver',
      missingCredentials: 'Proporciona tanto la Clave API como el Secreto',
      linkedSuccess: 'Cuenta de Bitso conectada exitosamente con {{count}} criptomoneda',
      linkedSuccess_plural: 'Cuenta de Bitso conectada exitosamente con {{count}} criptomonedas',
      connectFailed: 'Error al conectar cuenta de Bitso',
    },
  },
} as const;
