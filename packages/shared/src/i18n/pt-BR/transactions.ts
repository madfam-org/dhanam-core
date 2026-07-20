/**
 * Brazilian Portuguese Transactions Translations
 * Transaction management, categorization, filters
 */
export const transactions = {
  // Main
  transactions: 'Transações',
  transaction: 'Transação',
  newTransaction: 'Nova transação',
  addTransaction: 'Adicionar transação',
  editTransaction: 'Editar transação',
  deleteTransaction: 'Excluir transação',
  transactionDetails: 'Detalhes da transação',

  // Types
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',

  // Fields
  amount: 'Valor',
  date: 'Data',
  description: 'Descrição',
  merchant: 'Estabelecimento',
  category: 'Categoria',
  account: 'Conta',
  notes: 'Notas',
  metadata: 'Metadados',
  pending: 'Pendente',
  cleared: 'Compensada',
  reconciled: 'Conciliada',

  // Filters
  filterTransactions: 'Filtrar transações',
  allTransactions: 'Todas as transações',
  incomeOnly: 'Somente receitas',
  expensesOnly: 'Somente despesas',
  uncategorized: 'Sem categoria',
  dateRange: 'Período',
  amountRange: 'Faixa de valor',
  selectAccount: 'Selecionar conta',
  selectCategory: 'Selecionar categoria',
  selectMerchant: 'Selecionar estabelecimento',

  // Filter UI (transaction-filters.tsx)
  filter: {
    searchPlaceholder: 'Buscar transações...',
    category: 'Categoria',
    account: 'Conta',
    allCategories: 'Todas as categorias',
    allAccounts: 'Todas as contas',
    allTime: 'Todo o período',
    thisMonth: 'Este mês',
    lastMonth: 'Mês passado',
    last90: 'Últimos 90 dias',
    all: 'Todos',
    income: 'Receitas',
    expenses: 'Despesas',
    clear: 'Limpar',
  },

  // Sorting
  sortBy: 'Ordenar por',
  sortByDate: 'Data',
  sortByAmount: 'Valor',
  sortByMerchant: 'Estabelecimento',
  sortByCategory: 'Categoria',
  newest: 'Mais recente',
  oldest: 'Mais antigo',
  highest: 'Maior valor',
  lowest: 'Menor valor',

  // Categorization
  categorize: 'Categorizar',
  bulkCategorize: 'Categorizar em massa',
  autoCategorize: 'Categorização automática',
  categorizeSelected: 'Categorizar selecionadas',
  categoryRules: 'Regras de categorização',
  createRule: 'Criar regra',
  applyRules: 'Aplicar regras',
  rulesApplied: 'Regras aplicadas',

  // Actions
  split: 'Dividir',
  merge: 'Combinar',
  duplicate: 'Duplicar',
  markAsReconciled: 'Marcar como conciliada',
  markAsPending: 'Marcar como pendente',
  attachReceipt: 'Anexar recibo',
  viewReceipt: 'Ver recibo',

  // Bulk operations
  bulkEdit: 'Edição em massa',
  bulkDelete: 'Exclusão em massa',
  selectedTransactions: '{{count}} transações selecionadas',
  selectAll: 'Selecionar todas',
  deselectAll: 'Desmarcar todas',

  // Messages
  noTransactions: 'Não há transações',
  noTransactionsInRange: 'Não há transações neste período',
  transactionCreated: 'Transação criada',
  transactionUpdated: 'Transação atualizada',
  transactionDeleted: 'Transação excluída',
  transactionsCategorized: '{{count}} transações categorizadas',
  transactionsImported: '{{count}} transações importadas',

  // Import/Export
  importTransactions: 'Importar transações',
  exportTransactions: 'Exportar transações',
  downloadCSV: 'Baixar CSV',
  downloadPDF: 'Baixar PDF',
  uploadFile: 'Enviar arquivo',
  selectFile: 'Selecionar arquivo',
  supportedFormats: 'Formatos suportados: CSV, OFX, QFX',

  // Search
  searchTransactions: 'Buscar transações',
  searchByDescription: 'Buscar por descrição',
  searchByMerchant: 'Buscar por estabelecimento',

  // Stats
  totalIncome: 'Receitas totais',
  totalExpenses: 'Despesas totais',
  netIncome: 'Receita líquida',
  averageTransaction: 'Transação média',
  transactionCount: 'Quantidade de transações',
  largestExpense: 'Maior despesa',
  largestIncome: 'Maior receita',

  // Errors
  transactionNotFound: 'Transação não encontrada',
  invalidAmount: 'Valor inválido',
  invalidDate: 'Data inválida',
  accountRequired: 'A conta é obrigatória',
  amountRequired: 'O valor é obrigatório',
  dateRequired: 'A data é obrigatória',
  descriptionRequired: 'A descrição é obrigatória',

  // Page-level keys
  page: {
    title: 'Transações',
    description: 'Visualize e gerencie todas as suas transações',
  },
  button: {
    addTransaction: 'Adicionar Transação',
    createTransaction: 'Criar Transação',
    updateTransaction: 'Atualizar Transação',
  },
  action: {
    edit: 'Editar',
    delete: 'Excluir',
    categorize: 'Categorizar',
  },
  dialog: {
    create: {
      title: 'Criar Transação',
      description: 'Adicione uma nova transação à sua conta',
    },
    edit: {
      title: 'Editar Transação',
      description: 'Atualizar detalhes da transação',
    },
  },
  form: {
    account: 'Conta',
    selectAccount: 'Selecionar conta',
    amount: 'Valor',
    date: 'Data',
    description: 'Descrição',
    descriptionPlaceholder: 'ex., Compras de supermercado',
    merchantOptional: 'Estabelecimento (Opcional)',
    merchantPlaceholder: 'ex., Walmart',
  },
  list: {
    title: 'Transações Recentes',
    found: 'transações encontradas',
    unknownAccount: 'Desconhecido',
  },
  empty: {
    title: 'Sem transações ainda',
    description: 'Comece a adicionar transações para acompanhar seus gastos',
    addFirst: 'Adicione Sua Primeira Transação',
  },
  pagination: {
    previous: 'Anterior',
    next: 'Próximo',
  },
  toast: {
    createSuccess: 'Transação criada com sucesso',
    createFailed: 'Erro ao criar transação',
    updateSuccess: 'Transação atualizada com sucesso',
    updateFailed: 'Erro ao atualizar transação',
    deleteSuccess: 'Transação excluída com sucesso',
    deleteFailed: 'Erro ao excluir transação',
  },
  recurring: {
    title: 'Transações Recorrentes',
    description: 'Acompanhe e gerencie suas assinaturas e pagamentos regulares',
    detectPatterns: 'Detectar Padrões',
    monthlyTotal: 'Total Mensal',
    active: 'Ativas',
    confirmedRecurring: 'Recorrentes confirmadas',
    detected: 'Detectadas',
    awaitingConfirmation: 'Aguardando confirmação',
    upcoming: 'Próximas',
    thisMonth: 'Este mês',
    perYear: '{{amount}}/ano',
    frequency: {
      daily: 'Diário',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    },
    tabs: {
      active: 'Ativas ({{count}})',
      detected: 'Detectadas ({{count}})',
      paused: 'Pausadas ({{count}})',
    },
    emptyConfirmed: {
      title: 'Sem transações recorrentes confirmadas',
      description: 'Clique em "Detectar Padrões" para encontrar transações recorrentes',
    },
    emptyDetected: {
      title: 'Sem padrões detectados',
      description: 'Seu histórico de transações será analisado em busca de padrões recorrentes',
    },
    emptyPaused: {
      title: 'Sem padrões pausados',
      description: 'Os padrões pausados aparecerão aqui',
    },
    dialog: {
      lastOccurrence: 'Última Ocorrência',
      nextExpected: 'Próxima Esperada',
      occurrences: 'Ocorrências',
      confidence: 'Confiança',
      recentTransactions: 'Transações Recentes',
      close: 'Fechar',
    },
    card: {
      next: 'Próxima: {{date}}',
      viewDetails: 'Ver Detalhes',
      resume: 'Retomar',
      pause: 'Pausar',
      delete: 'Excluir',
      confirm: 'Confirmar',
      occurrences: '{{count}} ocorrências',
      confidence: '{{percent}}% de confiança',
      detectedLabel: 'Detectada: {{frequency}}',
    },
    toast: {
      detected: '{{count}} novos padrões recorrentes detectados',
      detectFailed: 'Erro ao detectar padrões',
      confirmed: 'Padrão recorrente confirmado',
      confirmFailed: 'Erro ao confirmar padrão',
      dismissed: 'Padrão descartado',
      dismissFailed: 'Erro ao descartar padrão',
      statusUpdated: 'Status atualizado',
      statusFailed: 'Erro ao atualizar status',
      deleted: 'Padrão excluído',
      deleteFailed: 'Erro ao excluir padrão',
    },
    na: 'N/D',
  },

  // Calendar view
  calendar: {
    title: 'Calendário',
    description: 'Visualize suas transações dia a dia.',
    today: 'Hoje',
    dayDetails: 'Detalhes do Dia',
    clickToSee: 'Clique em um dia para ver suas transações.',
    noDetails: 'Nenhum detalhe de transação disponível.',
    transactionCount: '{{count}} transação',
    transactionCountPlural: '{{count}} transações',
    income: 'Receita',
    expenses: 'Despesas',
    net: 'Líquido',
    monthlySummary: 'Resumo Mensal',
    noSpaceSelected: 'Nenhum espaço selecionado',
    selectSpacePrompt: 'Selecione um espaço para ver o calendário.',
    categoryBreakdown: 'Por Categoria',
    prevMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    uncategorized: 'Sem categoria',
  },
} as const;
