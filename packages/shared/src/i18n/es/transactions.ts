/**
 * Spanish Transactions Translations
 * Transaction management, categorization, filters
 */
export const transactions = {
  // Main
  transactions: 'Transacciones',
  transaction: 'Transacción',
  newTransaction: 'Nueva transacción',
  addTransaction: 'Agregar transacción',
  editTransaction: 'Editar transacción',
  deleteTransaction: 'Eliminar transacción',
  transactionDetails: 'Detalles de transacción',

  // Types
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',

  // Fields
  amount: 'Monto',
  date: 'Fecha',
  description: 'Descripción',
  merchant: 'Comercio',
  category: 'Categoría',
  account: 'Cuenta',
  notes: 'Notas',
  metadata: 'Metadatos',
  pending: 'Pendiente',
  cleared: 'Liquidada',
  reconciled: 'Conciliada',

  // Filters
  filterTransactions: 'Filtrar transacciones',
  allTransactions: 'Todas las transacciones',
  incomeOnly: 'Solo ingresos',
  expensesOnly: 'Solo gastos',
  uncategorized: 'Sin categorizar',
  dateRange: 'Rango de fechas',
  amountRange: 'Rango de monto',
  selectAccount: 'Seleccionar cuenta',
  selectCategory: 'Seleccionar categoría',
  selectMerchant: 'Seleccionar comercio',

  // Filter UI (transaction-filters.tsx)
  filter: {
    searchPlaceholder: 'Buscar transacciones...',
    category: 'Categoría',
    account: 'Cuenta',
    allCategories: 'Todas las categorías',
    allAccounts: 'Todas las cuentas',
    allTime: 'Todo el tiempo',
    thisMonth: 'Este mes',
    lastMonth: 'Mes pasado',
    last90: 'Últimos 90 días',
    all: 'Todos',
    income: 'Ingresos',
    expenses: 'Gastos',
    clear: 'Limpiar',
  },

  // Sorting
  sortBy: 'Ordenar por',
  sortByDate: 'Fecha',
  sortByAmount: 'Monto',
  sortByMerchant: 'Comercio',
  sortByCategory: 'Categoría',
  newest: 'Más reciente',
  oldest: 'Más antiguo',
  highest: 'Mayor monto',
  lowest: 'Menor monto',

  // Categorization
  categorize: 'Categorizar',
  bulkCategorize: 'Categorizar en masa',
  autoCategorize: 'Categorización automática',
  categorizeSelected: 'Categorizar seleccionadas',
  categoryRules: 'Reglas de categorización',
  createRule: 'Crear regla',
  applyRules: 'Aplicar reglas',
  rulesApplied: 'Reglas aplicadas',

  // Actions
  split: 'Dividir',
  merge: 'Combinar',
  duplicate: 'Duplicar',
  markAsReconciled: 'Marcar como conciliada',
  markAsPending: 'Marcar como pendiente',
  attachReceipt: 'Adjuntar recibo',
  viewReceipt: 'Ver recibo',

  // Bulk operations
  bulkEdit: 'Edición masiva',
  bulkDelete: 'Eliminación masiva',
  selectedTransactions: '{{count}} transacciones seleccionadas',
  selectAll: 'Seleccionar todas',
  deselectAll: 'Deseleccionar todas',

  // Messages
  noTransactions: 'No hay transacciones',
  noTransactionsInRange: 'No hay transacciones en este rango',
  transactionCreated: 'Transacción creada',
  transactionUpdated: 'Transacción actualizada',
  transactionDeleted: 'Transacción eliminada',
  transactionsCategorized: '{{count}} transacciones categorizadas',
  transactionsImported: '{{count}} transacciones importadas',

  // Import/Export
  importTransactions: 'Importar transacciones',
  exportTransactions: 'Exportar transacciones',
  downloadCSV: 'Descargar CSV',
  downloadPDF: 'Descargar PDF',
  uploadFile: 'Subir archivo',
  selectFile: 'Seleccionar archivo',
  supportedFormats: 'Formatos soportados: CSV, OFX, QFX',

  // Search
  searchTransactions: 'Buscar transacciones',
  searchByDescription: 'Buscar por descripción',
  searchByMerchant: 'Buscar por comercio',

  // Stats
  totalIncome: 'Ingresos totales',
  totalExpenses: 'Gastos totales',
  netIncome: 'Ingreso neto',
  averageTransaction: 'Transacción promedio',
  transactionCount: 'Cantidad de transacciones',
  largestExpense: 'Mayor gasto',
  largestIncome: 'Mayor ingreso',

  // Errors
  transactionNotFound: 'Transacción no encontrada',
  invalidAmount: 'Monto inválido',
  invalidDate: 'Fecha inválida',
  accountRequired: 'La cuenta es requerida',
  amountRequired: 'El monto es requerido',
  dateRequired: 'La fecha es requerida',
  descriptionRequired: 'La descripción es requerida',

  // Page-level keys
  page: {
    title: 'Transacciones',
    description: 'Ver y administrar todas tus transacciones',
  },
  button: {
    addTransaction: 'Agregar Transacción',
    createTransaction: 'Crear Transacción',
    updateTransaction: 'Actualizar Transacción',
  },
  action: {
    edit: 'Editar',
    delete: 'Eliminar',
    categorize: 'Categorizar',
  },
  dialog: {
    create: {
      title: 'Crear Transacción',
      description: 'Agrega una nueva transacción a tu cuenta',
    },
    edit: {
      title: 'Editar Transacción',
      description: 'Actualizar detalles de transacción',
    },
  },
  form: {
    account: 'Cuenta',
    selectAccount: 'Seleccionar cuenta',
    amount: 'Monto',
    date: 'Fecha',
    description: 'Descripción',
    descriptionPlaceholder: 'ej., Compras de supermercado',
    merchantOptional: 'Comercio (Opcional)',
    merchantPlaceholder: 'ej., Walmart',
  },
  list: {
    title: 'Transacciones Recientes',
    found: 'transacciones encontradas',
    unknownAccount: 'Desconocido',
  },
  empty: {
    title: 'Sin transacciones aún',
    description: 'Comienza a agregar transacciones para rastrear tus gastos',
    addFirst: 'Agrega Tu Primera Transacción',
  },
  pagination: {
    previous: 'Anterior',
    next: 'Siguiente',
  },
  toast: {
    createSuccess: 'Transacción creada exitosamente',
    createFailed: 'Error al crear transacción',
    updateSuccess: 'Transacción actualizada exitosamente',
    updateFailed: 'Error al actualizar transacción',
    deleteSuccess: 'Transacción eliminada exitosamente',
    deleteFailed: 'Error al eliminar transacción',
  },
  recurring: {
    title: 'Transacciones Recurrentes',
    description: 'Rastrea y administra tus suscripciones y pagos regulares',
    detectPatterns: 'Detectar Patrones',
    monthlyTotal: 'Total Mensual',
    active: 'Activas',
    confirmedRecurring: 'Recurrentes confirmadas',
    detected: 'Detectadas',
    awaitingConfirmation: 'Esperando confirmación',
    upcoming: 'Próximas',
    thisMonth: 'Este mes',
    perYear: '{{amount}}/año',
    frequency: {
      daily: 'Diario',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    },
    tabs: {
      active: 'Activas ({{count}})',
      detected: 'Detectadas ({{count}})',
      paused: 'Pausadas ({{count}})',
    },
    emptyConfirmed: {
      title: 'Sin transacciones recurrentes confirmadas',
      description: 'Haz clic en "Detectar Patrones" para encontrar transacciones recurrentes',
    },
    emptyDetected: {
      title: 'Sin patrones detectados',
      description: 'Tu historial de transacciones será analizado en busca de patrones recurrentes',
    },
    emptyPaused: {
      title: 'Sin patrones pausados',
      description: 'Los patrones pausados aparecerán aquí',
    },
    dialog: {
      lastOccurrence: 'Última Ocurrencia',
      nextExpected: 'Próxima Esperada',
      occurrences: 'Ocurrencias',
      confidence: 'Confianza',
      recentTransactions: 'Transacciones Recientes',
      close: 'Cerrar',
    },
    card: {
      next: 'Próxima: {{date}}',
      viewDetails: 'Ver Detalles',
      resume: 'Reanudar',
      pause: 'Pausar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      occurrences: '{{count}} ocurrencias',
      confidence: '{{percent}}% de confianza',
      detectedLabel: 'Detectada: {{frequency}}',
    },
    toast: {
      detected: 'Se detectaron {{count}} nuevos patrones recurrentes',
      detectFailed: 'Error al detectar patrones',
      confirmed: 'Patrón recurrente confirmado',
      confirmFailed: 'Error al confirmar patrón',
      dismissed: 'Patrón descartado',
      dismissFailed: 'Error al descartar patrón',
      statusUpdated: 'Estado actualizado',
      statusFailed: 'Error al actualizar estado',
      deleted: 'Patrón eliminado',
      deleteFailed: 'Error al eliminar patrón',
    },
    na: 'N/D',
  },

  // Calendar view
  calendar: {
    title: 'Calendario',
    description: 'Visualiza tus transacciones día por día.',
    today: 'Hoy',
    dayDetails: 'Detalles del Día',
    clickToSee: 'Haz clic en un día para ver sus transacciones.',
    noDetails: 'No hay detalles de transacciones disponibles.',
    transactionCount: '{{count}} transacción',
    transactionCountPlural: '{{count}} transacciones',
    income: 'Ingresos',
    expenses: 'Gastos',
    net: 'Neto',
    monthlySummary: 'Resumen Mensual',
    noSpaceSelected: 'Sin espacio seleccionado',
    selectSpacePrompt: 'Selecciona un espacio para ver el calendario.',
    categoryBreakdown: 'Por Categoría',
    prevMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    uncategorized: 'Sin categorizar',
  },
} as const;
