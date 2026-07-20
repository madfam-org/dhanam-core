export const importTranslations = {
  hub: {
    title: 'Importar seus dados',
    description: 'Traga orçamentos, transações e categorias de outras plataformas.',
    backToSettings: 'Voltar às configurações',
    disabled: 'A importação de plataformas ainda não está habilitada neste ambiente.',
    comingSoon: 'Em breve',
  },
  lunchmoney: {
    title: 'Lunch Money',
    subtitle: 'Importar via token de API de desenvolvedor',
    tokenLabel: 'Token de API',
    tokenPlaceholder: 'Cole seu token de API do Lunch Money',
    tokenHelp:
      'Gere um em Lunch Money → Configurações → Developers. Criptografamos e removemos após a importação.',
    startDateLabel: 'Data inicial do histórico',
    startDateHelp: 'Transações a partir desta data serão importadas (AAAA-MM-DD).',
    preview: 'Pré-visualizar',
    startImport: 'Iniciar importação',
    importing: 'Importando…',
    reconnectTitle: 'Reconecte seus bancos',
    reconnectBody:
      'Contas vinculadas entram como instantâneos. Conecte Belvo ou Plaid em Contas para continuar sincronizando.',
    reconnectCta: 'Ir para Contas',
    doneTitle: 'Importação concluída',
    doneBody:
      'Seus dados do Lunch Money estão no Dhanam. Revise categorias e reconecte bancos quando quiser.',
    limitations: 'Limitações conhecidas',
    counts: {
      categories: 'Categorias',
      tags: 'Tags',
      accounts: 'Contas',
      transactions: 'Transações',
      recurring: 'Recorrentes',
      plaid: 'Plaid (instantâneo)',
      splitParentsSkipped: 'Transações principais divididas ignoradas',
    },
    steps: {
      token: 'Conectar',
      preview: 'Prévia',
      progress: 'Importar',
      finish: 'Concluir',
    },
    errors: {
      preflight: 'Não foi possível conectar ao Lunch Money. Verifique o token.',
      start: 'Não foi possível iniciar a importação. Tente novamente.',
      failed: 'Importação falhou',
    },
    status: {
      pending: 'Na fila',
      running: 'Em andamento',
      completed: 'Concluída',
      failed: 'Falhou',
      cancelled: 'Cancelada',
    },
  },
  platforms: {
    ynab: 'YNAB',
    monarch: 'Monarch Money',
    rocket: 'Rocket Money',
    csv: 'Arquivo CSV',
  },
};
