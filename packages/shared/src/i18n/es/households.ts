/**
 * Spanish Households Translations
 * Terms for multi-generational family planning
 */
export const households = {
  // General Terms
  household: 'Hogar',
  households: 'Hogares',
  householdMember: 'Miembro del Hogar',
  householdMembers: 'Miembros del Hogar',
  multiGenerationalPlanning: 'Planificación Multigeneracional',

  // Household Types
  types: {
    family: 'Familia',
    individual: 'Individual',
    trust: 'Fideicomiso',
    estate: 'Patrimonio',
    partnership: 'Sociedad',
  },

  // Relationship Types
  relationships: {
    spouse: 'Cónyuge',
    child: 'Hijo/a',
    parent: 'Padre/Madre',
    grandparent: 'Abuelo/a',
    grandchild: 'Nieto/a',
    sibling: 'Hermano/a',
    other: 'Otro',
  },

  // Actions
  createHousehold: 'Crear Hogar',
  updateHousehold: 'Actualizar Hogar',
  deleteHousehold: 'Eliminar Hogar',
  viewHousehold: 'Ver Hogar',

  addMember: 'Agregar Miembro',
  updateMember: 'Actualizar Miembro',
  removeMember: 'Quitar Miembro',

  switchHousehold: 'Cambiar Hogar',

  // Form Fields
  householdName: 'Nombre del Hogar',
  householdNamePlaceholder: 'ej., Familia Smith',
  householdType: 'Tipo de Hogar',
  baseCurrency: 'Moneda Base',
  description: 'Descripción',
  descriptionPlaceholder: 'Descripción del hogar (opcional)',
  descriptionOptional: 'Descripción (Opcional)',

  memberName: 'Nombre del Miembro',
  relationship: 'Relación',
  isMinor: 'Es Menor de Edad',
  dateOfBirth: 'Fecha de Nacimiento',
  accessStartDate: 'Fecha de Inicio de Acceso',
  accessStartDateOptional: 'Fecha de Inicio de Acceso (Opcional)',

  // Labels & Headers
  householdDetails: 'Detalles del Hogar',
  householdManagement: 'Gestión del Hogar',
  memberManagement: 'Gestión de Miembros',

  netWorth: 'Patrimonio Neto',
  householdNetWorth: 'Patrimonio Neto del Hogar',
  totalNetWorth: 'Patrimonio Neto Total',

  assets: 'Activos',
  liabilities: 'Pasivos',
  bySpace: 'Por Espacio',

  goals: 'Objetivos',
  householdGoals: 'Objetivos del Hogar',
  goalSummary: 'Resumen de Objetivos',
  totalGoals: 'Objetivos Totales',
  activeGoals: 'Objetivos Activos',
  achievedGoals: 'Objetivos Alcanzados',
  totalTargetAmount: 'Monto Objetivo Total',
  byType: 'Por Tipo',

  // Messages & Alerts
  noHouseholdsYet: 'Aún No Hay Hogares',
  noHouseholdsDescription: 'Crea tu primer hogar para comenzar la planificación familiar',

  noMembersYet: 'Aún No Hay Miembros',
  noMembersDescription:
    'Agrega miembros a tu hogar para comenzar la planificación multigeneracional',

  householdCreatedSuccess: 'Hogar creado exitosamente',
  householdUpdatedSuccess: 'Hogar actualizado exitosamente',
  householdDeletedSuccess: 'Hogar eliminado exitosamente',

  memberAddedSuccess: 'Miembro agregado exitosamente',
  memberUpdatedSuccess: 'Miembro actualizado exitosamente',
  memberRemovedSuccess: 'Miembro eliminado exitosamente',

  // Errors
  householdNotFound: 'Hogar no encontrado',
  noAccessToHousehold: 'No tienes acceso a este hogar',
  memberNotFound: 'Miembro no encontrado',

  cannotDeleteHouseholdWithSpaces: 'No se puede eliminar un hogar con espacios vinculados',
  cannotDeleteHouseholdWithGoals: 'No se puede eliminar un hogar con objetivos activos',
  cannotRemoveLastMember: 'No se puede eliminar el último miembro del hogar',

  userNotFound: 'Usuario no encontrado',
  memberAlreadyExists: 'El usuario ya es miembro de este hogar',
  mustBeMember: 'Debes ser miembro del hogar',

  // Descriptions
  createHouseholdDescription: 'Crea un nuevo hogar para la planificación financiera familiar',
  familyHousehold: 'Un hogar nuclear o extendido tradicional',
  individualHousehold: 'Planificación individual sin otros miembros',
  trustHousehold: 'Un fideicomiso o vehículo legal',
  estateHousehold: 'Planificación patrimonial para administración de bienes',

  // Net Worth Details
  netWorthCalculation: 'Cálculo del Patrimonio Neto',
  includesAllSpaces: 'Incluye todos los espacios vinculados a este hogar',
  assetAllocation: 'Asignación de Activos',
  liabilityBreakdown: 'Desglose de Pasivos',

  // Goal Details
  retirementGoals: 'Objetivos de Retiro',
  educationGoals: 'Objetivos de Educación',
  savingsGoals: 'Objetivos de Ahorro',
  investmentGoals: 'Objetivos de Inversión',

  // Member Details
  memberCount: '{count} miembros',
  minorMember: 'Menor de Edad',
  adultMember: 'Adulto',

  accessGrantedOn: 'Acceso Otorgado el',
  joinedOn: 'Se Unió el',

  // Tooltips & Help
  whatIsHousehold: '¿Qué es un hogar?',
  householdExplanation:
    'Un hogar es un grupo de personas que comparten planificación financiera, como una familia, fideicomiso o patrimonio.',

  multiGenPlanningHelp:
    'La planificación multigeneracional te ayuda a coordinar objetivos financieros en múltiples generaciones',

  minorAccessHelp: 'Los menores tienen acceso limitado hasta que alcancen la mayoría de edad',

  currencyHelp:
    'La moneda base se utiliza para todos los cálculos de patrimonio neto de este hogar',

  // Page-level keys (used by households page component)
  page: {
    title: 'Hogares',
    description: 'Administra la planificación financiera familiar multigeneracional',
    createHousehold: 'Crear hogar',
  },
  dialog: {
    createTitle: 'Crear nuevo hogar',
    createDescription: 'Crea un hogar para organizar la planificación financiera multigeneracional',
  },
  fields: {
    name: 'Nombre',
    namePlaceholder: 'Familia García',
    type: 'Tipo',
    baseCurrency: 'Moneda base',
    descriptionOptional: 'Descripción (Opcional)',
    descriptionPlaceholder: 'Hogar familiar principal',
  },
  empty: {
    title: 'Aún no hay hogares',
    description: 'Crea tu primer hogar para comenzar la planificación multigeneracional',
  },
  detail: {
    totalNetWorth: 'Patrimonio neto total',
    goalsSummary: 'Resumen de objetivos',
    totalGoals: 'Total de objetivos:',
    active: 'Activos:',
    achieved: 'Alcanzados:',
    targetAmount: 'Monto objetivo:',
    members: 'Miembros',
    minor: 'Menor de edad',
    yoursMineOurs: 'Tuyo, mío y nuestro',
    ownershipDescription:
      'Visualiza las finanzas del hogar por titularidad. Filtra cuentas entre propiedad individual y conjunta.',
    yourAccounts: 'Tus cuentas',
    partnerAccounts: 'Cuentas de tu pareja',
    jointAccounts: 'Cuentas conjuntas',
    allAccounts: 'Todas las cuentas',
  },
  labels: {
    members: 'Miembros:',
    spaces: 'Espacios:',
    goals: 'Objetivos:',
  },
  actions: {
    cancel: 'Cancelar',
    create: 'Crear',
  },

  // Currencies
  currencies: {
    USD: 'Dólar Estadounidense (USD)',
    MXN: 'Peso Mexicano (MXN)',
    EUR: 'Euro (EUR)',
  },
};
