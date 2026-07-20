export const importTranslations = {
  hub: {
    title: 'Importar tus datos',
    description: 'Trae presupuestos, transacciones y categorías de otras plataformas.',
    backToSettings: 'Volver a configuración',
    disabled: 'La importación de plataformas aún no está habilitada en este entorno.',
    comingSoon: 'Próximamente',
  },
  lunchmoney: {
    title: 'Lunch Money',
    subtitle: 'Importar con token de API de desarrollador',
    tokenLabel: 'Token de API',
    tokenPlaceholder: 'Pega tu token de API de Lunch Money',
    tokenHelp:
      'Genera uno en Lunch Money → Configuración → Developers. Lo ciframos y lo eliminamos después de importar.',
    startDateLabel: 'Fecha inicial del historial',
    startDateHelp: 'Se importarán transacciones desde esta fecha (AAAA-MM-DD).',
    preview: 'Vista previa',
    startImport: 'Iniciar importación',
    importing: 'Importando…',
    reconnectTitle: 'Reconecta tus bancos',
    reconnectBody:
      'Las cuentas vinculadas se importan como instantáneas. Conecta Belvo o Plaid en Cuentas para seguir sincronizando.',
    reconnectCta: 'Ir a Cuentas',
    doneTitle: 'Importación completa',
    doneBody:
      'Tus datos de Lunch Money están en Dhanam. Revisa categorías y reconecta bancos cuando quieras.',
    limitations: 'Limitaciones conocidas',
    counts: {
      categories: 'Categorías',
      tags: 'Etiquetas',
      accounts: 'Cuentas',
      transactions: 'Transacciones',
      recurring: 'Recurrentes',
      plaid: 'Plaid (instantánea)',
      splitParentsSkipped: 'Divisiones principales omitidas',
    },
    steps: {
      token: 'Conectar',
      preview: 'Vista previa',
      progress: 'Importar',
      finish: 'Listo',
    },
    errors: {
      preflight: 'No se pudo conectar con Lunch Money. Revisa tu token.',
      start: 'No se pudo iniciar la importación. Intenta de nuevo.',
      failed: 'La importación falló',
    },
    status: {
      pending: 'En cola',
      running: 'En curso',
      completed: 'Completada',
      failed: 'Fallida',
      cancelled: 'Cancelada',
    },
  },
  platforms: {
    ynab: 'YNAB',
    monarch: 'Monarch Money',
    rocket: 'Rocket Money',
    csv: 'Archivo CSV',
  },
};
