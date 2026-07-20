/**
 * Spanish Estate Planning Translations
 * Terms and phrases for digital wills and beneficiary management
 */
export const estatePlanning = {
  // General Terms
  estatePlanning: 'Planificación Patrimonial',
  will: 'Testamento',
  wills: 'Testamentos',
  digitalWill: 'Testamento Digital',
  beneficiary: 'Beneficiario',
  beneficiaries: 'Beneficiarios',
  executor: 'Albacea',
  executors: 'Albaceas',

  // Will Status
  status: {
    draft: 'Borrador',
    active: 'Activo',
    revoked: 'Revocado',
    executed: 'Ejecutado',
  },

  // Asset Types
  assetTypes: {
    bank_account: 'Cuenta Bancaria',
    investment_account: 'Cuenta de Inversión',
    crypto_account: 'Cuenta de Criptomonedas',
    real_estate: 'Bienes Raíces',
    business_interest: 'Participación Empresarial',
    personal_property: 'Propiedad Personal',
    other: 'Otro',
  },

  // Actions
  createWill: 'Crear Testamento',
  updateWill: 'Actualizar Testamento',
  deleteWill: 'Eliminar Testamento',
  activateWill: 'Activar Testamento',
  revokeWill: 'Revocar Testamento',
  viewWill: 'Ver Testamento',

  addBeneficiary: 'Agregar Beneficiario',
  updateBeneficiary: 'Actualizar Beneficiario',
  removeBeneficiary: 'Quitar Beneficiario',

  addExecutor: 'Agregar Albacea',
  updateExecutor: 'Actualizar Albacea',
  removeExecutor: 'Quitar Albacea',

  validate: 'Validar',
  validateWill: 'Validar Testamento',

  // Form Fields
  willName: 'Nombre del Testamento',
  willNamePlaceholder: 'ej., Testamento Familiar Smith 2025',
  notes: 'Notas',
  notesPlaceholder: 'Notas o instrucciones adicionales',
  notesOptional: 'Notas (Opcional)',

  legalDisclaimer: 'Aviso Legal',
  legalDisclaimerText:
    'Entiendo que esto es un testamento digital y debo consultar con un asesor legal',
  acceptLegalDisclaimer: 'Acepto el aviso legal',

  percentage: 'Porcentaje',
  percentageAllocation: 'Asignación de Porcentaje',
  assetType: 'Tipo de Activo',
  specificAsset: 'Activo Específico',
  specificAssetOptional: 'Activo Específico (Opcional)',

  primaryExecutor: 'Albacea Principal',
  executorOrder: 'Orden de Ejecución',
  isPrimary: 'Es Principal',

  conditions: 'Condiciones',
  conditionsOptional: 'Condiciones (Opcional)',

  // Labels & Headers
  willDetails: 'Detalles del Testamento',
  willManagement: 'Gestión del Testamento',
  beneficiaryAllocation: 'Asignación de Beneficiarios',
  executorManagement: 'Gestión de Albaceas',

  beneficiaryCount: 'Beneficiarios',
  executorCount: 'Albaceas',

  activatedAt: 'Activado',
  revokedAt: 'Revocado',
  executedAt: 'Ejecutado',
  lastReviewed: 'Última Revisión',

  // Messages & Alerts
  noWillsYet: 'Aún No Hay Testamentos',
  noWillsDescription:
    'Crea tu primer testamento para comenzar la planificación patrimonial de tu hogar',

  cannotActivateWill: 'No se puede activar el testamento',
  validationErrors: 'Errores de Validación',

  mustHaveBeneficiaries: 'Debe tener al menos un beneficiario',
  mustHaveExecutors: 'Debe tener al menos un albacea',
  mustAcceptDisclaimer: 'Debes aceptar el aviso legal antes de la activación',

  allocationMustBe100: 'Las asignaciones deben sumar 100% por tipo de activo',
  allocationInvalid: 'Las asignaciones de beneficiarios son inválidas',

  willCreatedSuccess: 'Testamento creado exitosamente',
  willUpdatedSuccess: 'Testamento actualizado exitosamente',
  willDeletedSuccess: 'Testamento eliminado exitosamente',
  willActivatedSuccess: 'Testamento activado exitosamente',
  willRevokedSuccess: 'Testamento revocado exitosamente',

  beneficiaryAddedSuccess: 'Beneficiario agregado exitosamente',
  beneficiaryUpdatedSuccess: 'Beneficiario actualizado exitosamente',
  beneficiaryRemovedSuccess: 'Beneficiario eliminado exitosamente',

  executorAddedSuccess: 'Albacea agregado exitosamente',
  executorUpdatedSuccess: 'Albacea actualizado exitosamente',
  executorRemovedSuccess: 'Albacea eliminado exitosamente',

  // Errors
  willNotFound: 'Testamento no encontrado',
  noAccessToWill: 'No tienes acceso a este testamento',
  beneficiaryNotFound: 'Beneficiario no encontrado',
  executorNotFound: 'Albacea no encontrado',

  cannotUpdateActiveWill: 'No se puede actualizar un testamento activo',
  cannotDeleteActiveWill:
    'No se puede eliminar un testamento activo. Revoca los testamentos activos en su lugar.',
  cannotModifyExecutedWill: 'No se puede modificar un testamento ejecutado',

  beneficiaryMustBeHouseholdMember: 'El beneficiario debe ser miembro del hogar',
  executorMustBeHouseholdMember: 'El albacea debe ser miembro del hogar',

  previousWillAutoRevoked: 'El testamento activo anterior fue revocado automáticamente',

  // Descriptions
  createWillDescription:
    'Crea un borrador de testamento para tu hogar. Puedes agregar beneficiarios y albaceas antes de activarlo.',
  activateWillDescription:
    'Activar este testamento lo hará legalmente vinculante (sujeto a revisión legal)',
  revokeWillDescription:
    'Revocar este testamento lo hará inválido. Esta acción no se puede deshacer.',

  draftWillsOnly: 'Solo se pueden eliminar testamentos en borrador',
  oneActiveWillPerHousehold: 'Solo un testamento activo por hogar',

  // Validation
  validationPassed: 'Validación aprobada',
  validationFailed: 'Validación fallida',

  // Tooltips & Help
  whatIsDigitalWill: '¿Qué es un testamento digital?',
  digitalWillExplanation:
    'Un testamento digital es una herramienta de planificación patrimonial que te ayuda a organizar la distribución de activos. Consulta siempre con un asesor legal para la validez legal.',

  beneficiaryAllocationHelp:
    'Las asignaciones de porcentaje deben sumar 100% para cada tipo de activo',
  executorOrderHelp:
    'El albacea principal es responsable de ejecutar el testamento. Los albaceas secundarios sirven como respaldo.',

  // Page-level keys (used by estate-planning page component)
  page: {
    title: 'Planificación Patrimonial',
    description: 'Administra testamentos, beneficiarios y planificación de herencia',
    createWill: 'Crear Testamento',
    createDraft: 'Crear Borrador',
    noWills: 'Sin Testamentos Aún',
    noWillsDescription:
      'Crea tu primer testamento para comenzar la planificación patrimonial de tu hogar',
    willDetails: 'Detalles y Gestión del Testamento',
    noBeneficiaries: 'Sin beneficiarios agregados aún',
    noExecutors: 'Sin albaceas asignados aún',
  },
  dialog: {
    createWill: {
      title: 'Crear Nuevo Testamento',
      description:
        'Crea un borrador de testamento para tu hogar. Puedes agregar beneficiarios y albaceas antes de activarlo.',
    },
  },
  fields: {
    willName: 'Nombre del Testamento',
    willNamePlaceholder: 'ej., Testamento Familia García 2025',
    notesOptional: 'Notas (Opcional)',
    notesPlaceholder: 'Notas o instrucciones adicionales',
    legalDisclaimer: 'Entiendo que este es un testamento digital y debo consultar asesoría legal',
    beneficiaries: 'Beneficiarios:',
    executors: 'Albaceas:',
    activated: 'Activado:',
    primary: 'Principal',
    order: 'Orden:',
  },
  actions: {
    activate: 'Activar Testamento',
    revoke: 'Revocar Testamento',
    cancel: 'Cancelar',
    close: 'Cerrar',
  },
  validation: {
    cannotActivate: 'No se puede activar el testamento:',
  },
  lifeBeat: {
    title: 'Life Beat',
    description: 'Tu red de seguridad financiera ante las incertidumbres de la vida',
    protectionStatus: 'Estado de Protección',
    statusDescription:
      'Life Beat monitorea tu actividad y alerta a contactos de confianza si es necesario',
    lastActivity: 'Última Actividad',
    daysAgo: 'hace {{days}} días',
    alertThresholds: 'Umbrales de Alerta',
    trustedExecutors: 'Albaceas de Confianza',
    pendingAlerts: 'Alertas Pendientes',
    pendingAlertsDescription:
      'Tienes {{count}} alerta(s) de inactividad pendiente(s). Regístrate para reiniciar tu temporizador.',
    checkIn: 'Estoy Bien - Registrarme Ahora',
    disabled: {
      title: 'Life Beat está Desactivado',
      description:
        'Activa Life Beat para asegurar que tus albaceas designados puedan acceder a tu información financiera si algo te sucede.',
      enable: 'Activar Life Beat',
    },
    executors: {
      title: 'Albaceas Designados',
      description: 'Personas de confianza que pueden acceder a tu resumen financiero',
      add: 'Agregar Albacea',
      empty: {
        title: 'Sin Albaceas Aún',
        description: 'Agrega personas de confianza que puedan acceder a tu información financiera.',
      },
      verified: 'Verificado',
      pending: 'Pendiente',
      accessGranted: 'Acceso Otorgado',
    },
    addDialog: {
      title: 'Agregar Albacea',
      description: 'Agrega una persona de confianza que pueda acceder a tu información financiera.',
      fullName: 'Nombre Completo',
      namePlaceholder: 'Juan Pérez',
      email: 'Correo Electrónico',
      emailPlaceholder: 'juan@ejemplo.com',
      relationship: 'Relación',
      relationships: {
        spouse: 'Cónyuge',
        child: 'Hijo/a',
        sibling: 'Hermano/a',
        parent: 'Padre/Madre',
        attorney: 'Abogado/a',
        financialAdvisor: 'Asesor Financiero',
        other: 'Otro',
      },
      cancel: 'Cancelar',
      submit: 'Agregar Albacea',
    },
    howItWorks: {
      title: 'Cómo Funciona Life Beat',
      step1: {
        title: 'Monitoreo de Actividad',
        description: 'Rastreamos tus inicios de sesión y actividad. Si estás activo, no pasa nada.',
      },
      step2: {
        title: 'Alertas Escalonadas',
        description:
          'Después de 30, 60, 90 días de inactividad, te enviamos recordatorios de registro.',
      },
      step3: {
        title: 'Acceso del Albacea',
        description: 'Si no respondes, tus albaceas pueden solicitar acceso de solo lectura.',
      },
    },
    enableDialog: {
      title: 'Activar Protección Life Beat',
      description: 'Configura tus umbrales de inactividad y acepta el aviso legal.',
      thresholdLabel: 'Umbrales de Alerta (días de inactividad)',
      days: '{{days}} días',
      thresholdHint:
        'Recibirás recordatorios en cada umbral. Los albaceas son notificados en el umbral final.',
      legalTitle: 'Aviso Legal Importante',
      legalDescription:
        'Life Beat proporciona acceso de solo lectura a resúmenes financieros. No otorga autoridad de transacción, acceso a cuentas ni poder legal notarial. Esta función está diseñada solo con fines informativos y debe complementar, no reemplazar, una planificación patrimonial adecuada con asesoría legal.',
      legalCheckbox:
        'Entiendo que Life Beat proporciona visibilidad financiera de solo lectura y no constituye un poder legal notarial ni autoridad de acceso a cuentas. Acepto los Términos de Servicio de esta función.',
      cancel: 'Cancelar',
      enable: 'Activar Life Beat',
    },
  },
} as const;
