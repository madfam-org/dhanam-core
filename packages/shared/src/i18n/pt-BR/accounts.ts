/**
 * Brazilian Portuguese Accounts Translations
 * Financial accounts, connections, sync
 */
export const accounts = {
  // Main
  accounts: 'Contas',
  account: 'Conta',
  myAccounts: 'Minhas contas',
  addAccount: 'Adicionar conta',
  newAccount: 'Nova conta',
  editAccount: 'Editar conta',
  deleteAccount: 'Excluir conta',
  accountDetails: 'Detalhes da conta',
  manualAccount: 'Conta manual',
  connectedAccount: 'Conta conectada',

  // Types
  checking: 'Conta corrente',
  savings: 'Conta poupança',
  credit: 'Cartão de crédito',
  investment: 'Investimento',
  loan: 'Empréstimo',
  mortgage: 'Financiamento',
  crypto: 'Criptomoedas',
  cash: 'Dinheiro',
  other: 'Outro',

  // Providers
  providerLabel: 'Provedor',
  manual: 'Manual',
  belvo: 'Belvo',
  plaid: 'Plaid',
  bitso: 'Bitso',
  connected: 'Conectado',
  disconnected: 'Desconectado',

  // Fields
  accountName: 'Nome da conta',
  accountTypeLabel: 'Tipo de conta',
  accountNumber: 'Número da conta',
  lastFourDigits: 'Últimos 4 dígitos',
  routingNumber: 'Número de roteamento',
  institution: 'Instituição',
  balance: 'Saldo',
  availableBalance: 'Saldo disponível',
  currentBalance: 'Saldo atual',
  creditLimit: 'Limite de crédito',
  currency: 'Moeda',
  lastSynced: 'Última sincronização',
  status: 'Status',

  // Status
  active: 'Ativa',
  inactive: 'Inativa',
  syncing: 'Sincronizando',
  syncFailed: 'Sincronização falhou',
  needsReauth: 'Requer reautenticação',
  closed: 'Encerrada',

  // Actions
  connectAccount: 'Conectar conta',
  reconnect: 'Reconectar',
  disconnect: 'Desconectar',
  refreshBalance: 'Atualizar saldo',
  syncNow: 'Sincronizar agora',
  updateBalance: 'Atualizar saldo',
  viewTransactions: 'Ver transações',
  hideAccount: 'Ocultar conta',
  showAccount: 'Mostrar conta',

  // Connection
  selectInstitution: 'Selecionar instituição',
  searchInstitutions: 'Buscar instituições',
  popularInstitutions: 'Instituições populares',
  allInstitutions: 'Todas as instituições',
  enterCredentials: 'Digite suas credenciais',
  authorizingConnection: 'Autorizando conexão',
  connectionSuccessful: 'Conexão bem-sucedida',
  connectionFailed: 'Conexão falhou',
  retryConnection: 'Tentar conexão novamente',

  // Sync
  syncInProgress: 'Sincronização em andamento',
  syncCompleted: 'Sincronização concluída',
  lastSyncedAt: 'Última sincronização: {{time}}',
  neverSynced: 'Nunca sincronizado',
  autoSync: 'Sincronização automática',
  enableAutoSync: 'Habilitar sincronização automática',
  syncFrequency: 'Frequência de sincronização',
  syncEveryHour: 'A cada hora',
  syncDaily: 'Diariamente',
  syncWeekly: 'Semanalmente',

  // Balance
  totalBalance: 'Saldo total',
  netWorth: 'Patrimônio líquido',
  assets: 'Ativos',
  liabilities: 'Passivos',
  positiveBalance: 'Saldo positivo',
  negativeBalance: 'Saldo negativo',
  balanceHistory: 'Histórico de saldo',

  // Messages
  noAccounts: 'Você não tem contas',
  addFirstAccount: 'Adicione sua primeira conta',
  accountCreated: 'Conta criada',
  accountUpdated: 'Conta atualizada',
  accountDeleted: 'Conta excluída',
  accountConnected: 'Conta conectada',
  accountDisconnected: 'Conta desconectada',
  balanceUpdated: 'Saldo atualizado',

  // Warnings
  accountInactive: 'Esta conta está inativa',
  syncRequired: 'Sincronização necessária',
  reauthRequired: 'Reautenticação necessária',
  providerIssue: 'Problema com o provedor',
  staleData: 'Dados desatualizados',

  // Errors
  accountNotFound: 'Conta não encontrada',
  institutionNotFound: 'Instituição não encontrada',
  invalidAccountNumber: 'Número de conta inválido',
  connectionError: 'Erro de conexão',
  authenticationFailed: 'Autenticação falhou',
  insufficientPermissions: 'Permissões insuficientes',
  providerError: 'Erro do provedor',
  accountNameRequired: 'O nome da conta é obrigatório',
  accountTypeRequired: 'O tipo de conta é obrigatório',
  balanceRequired: 'O saldo é obrigatório',
  currencyRequired: 'A moeda é obrigatória',

  // Confirmation
  confirmDelete: 'Excluir esta conta?',
  deleteWarning: 'Isso também excluirá todas as transações associadas',
  confirmDisconnect: 'Desconectar esta conta?',
  disconnectWarning: 'Você precisará se autenticar novamente para reconectar',

  // Page-level keys
  page: {
    title: 'Contas',
    description: 'Conecte suas contas bancárias e gerencie suas finanças',
  },
  provider: {
    belvo: 'Belvo (México)',
    plaid: 'Plaid (EUA)',
    bitso: 'Bitso (Crypto)',
    manual: 'Entrada Manual',
  },
  button: {
    addAccount: 'Adicionar Conta',
    addManually: 'Adicionar Manualmente',
    createAccount: 'Criar Conta',
  },
  action: {
    delete: 'Excluir',
  },
  dialog: {
    addAccount: {
      title: 'Adicionar Conta',
      description: 'Conecte sua conta bancária ou adicione uma manualmente',
      connectProvider: 'Conectar com Provedor',
      or: 'Ou',
    },
    createManual: {
      title: 'Criar Conta Manual',
      description: 'Adicione uma conta que você atualizará manualmente',
    },
  },
  form: {
    accountName: 'Nome da Conta',
    accountNamePlaceholder: 'ex., Conta Corrente Itaú',
    accountType: 'Tipo de Conta',
    selectAccountType: 'Selecione o tipo de conta',
    currency: 'Moeda',
    selectCurrency: 'Selecione a moeda',
    currentBalance: 'Saldo Atual',
  },
  accountType: {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    credit: 'Cartão de Crédito',
    investment: 'Investimento',
    crypto: 'Crypto',
    other: 'Outro',
  },
  card: {
    lastUpdated: 'Última atualização:',
  },
  empty: {
    title: 'Sem contas ainda',
    description: 'Conecte suas contas bancárias para começar a acompanhar suas finanças',
    addFirst: 'Adicione Sua Primeira Conta',
  },
  toast: {
    connectSuccess: 'Conta conectada com sucesso',
    connectFailed: 'Erro ao conectar conta',
    createSuccess: 'Conta criada com sucesso',
    createFailed: 'Erro ao criar conta',
    deleteSuccess: 'Conta excluída com sucesso',
    deleteFailed: 'Erro ao excluir conta',
  },

  // Provider connection dialogs
  providers: {
    // Belvo
    belvo: {
      title: 'Conectar conta bancária mexicana',
      description:
        'Conecte com segurança sua conta bancária mexicana usando Belvo. Suas credenciais são criptografadas e usadas apenas para obter seus dados financeiros.',
      securityTitle: 'Segurança bancária',
      securityEncryption: 'Criptografia AES de 256 bits para credenciais',
      securityReadOnly: 'Acesso somente leitura às suas contas',
      securityRegulated: 'Acesso regulado pela CNBV',
      securityKms: 'Credenciais criptografadas com AWS KMS',
      supportedBanks: 'Bancos mexicanos suportados',
      moreInstitutions: 'E mais de 40 instituições financeiras mexicanas',
      usernameLabel: 'Usuário / ID do cliente',
      usernamePlaceholder: 'Seu usuário do internet banking',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Sua senha do internet banking',
      readOnlyNotice:
        'Acessaremos apenas seus saldos e histórico de transações. Não é possível realizar transferências ou pagamentos através desta conexão.',
      connecting: 'Conectando...',
      connectButton: 'Conectar conta bancária',
      privacyConsent: 'Ao conectar, você aceita a',
      linkedSuccess: '{{count}} conta de {{bank}} vinculada com sucesso',
      linkedSuccess_plural: '{{count}} contas de {{bank}} vinculadas com sucesso',
      invalidCredentials: 'Usuário ou senha inválidos',
      institutionError: 'O banco está temporariamente indisponível',
      mfaRequired: 'Seu banco requer um token de uso único para concluir a conexão',
      mfaTitle: 'Verificação em duas etapas',
      mfaDescription:
        'Seu banco enviou um token de uso único (SMS, app ou dispositivo físico). Digite-o abaixo para concluir a conexão da sua conta.',
      tokenLabel: 'Token de uso único',
      tokenPlaceholder: 'Digite o token do seu banco',
      verifying: 'Verificando...',
      verifyButton: 'Verificar e conectar',
      mfaFailed: 'A verificação do token falhou. Tente conectar novamente.',
      mfaBack: 'Voltar',
      linkFailed: 'Erro ao conectar conta bancária',
    },
    // Plaid
    plaid: {
      title: 'Conectar conta bancária dos EUA',
      description:
        'Conecte com segurança sua conta bancária dos EUA usando Plaid. Suas credenciais são criptografadas e nunca armazenadas em nossos servidores.',
      securityTitle: 'Segurança bancária',
      securityEncryption: 'Criptografia SSL de 256 bits',
      securityReadOnly: 'Acesso somente leitura às suas contas',
      securityTrusted: 'Usado por milhares de aplicativos financeiros',
      securityNoPasswords: 'Senhas não são armazenadas',
      supportedBanks: 'Bancos e cooperativas de crédito suportados',
      moreInstitutions: 'E mais de 10.000 instituições financeiras dos EUA',
      initializing: 'Inicializando...',
      connecting: 'Conectando...',
      connectButton: 'Conectar conta bancária',
      privacyConsent: 'Ao conectar, você aceita a',
      initFailed: 'Erro ao inicializar Plaid Link',
      linkedSuccess: '{{count}} conta vinculada com sucesso',
      linkedSuccess_plural: '{{count}} contas vinculadas com sucesso',
      linkFailed: 'Erro ao vincular conta',
      exitError: 'Erro ao conectar conta bancária',
    },
    // Bitso
    bitso: {
      title: 'Conectar conta Bitso',
      description:
        'Conecte sua conta Bitso para acompanhar automaticamente seu portfólio de criptomoedas',
      securityNotice: 'Suas credenciais de API estão criptografadas e seguras.',
      securityDetail:
        'Usamos criptografia de nível bancário e nunca armazenamos suas credenciais em texto simples.',
      howToGetCredentials: 'Como obter suas credenciais de API da Bitso',
      step1Title: 'Faça login na Bitso',
      step1Description: 'e entre na sua conta',
      step2Title: 'Navegue até Configurações de API',
      step2Description: 'Vá para Configurações → API → Criar Nova Chave API',
      step3Title: 'Configure permissões',
      step3Description: 'Habilite apenas a permissão de Visualização (acesso somente leitura)',
      step4Title: 'Copie suas credenciais',
      step4Description: 'Copie sua Chave API e Segredo (você só verá o segredo uma vez!)',
      permissionsWarning:
        'Habilite apenas permissões de "Visualização". Nunca conceda permissões de trading a aplicativos de terceiros.',
      supportedCryptos: 'Criptomoedas suportadas',
      haveCredentials: 'Tenho minhas credenciais de API',
      cancel: 'Cancelar',
      apiKeyLabel: 'Chave API',
      apiKeyPlaceholder: 'Sua Chave API da Bitso',
      apiSecretLabel: 'Segredo API',
      apiSecretPlaceholder: 'Seu Segredo API da Bitso',
      enableAutoSync: 'Habilitar sincronização automática do portfólio',
      encryptionNotice:
        'Suas credenciais serão criptografadas com AES-256 antes de serem armazenadas.',
      connecting: 'Conectando...',
      connectButton: 'Conectar conta Bitso',
      back: 'Voltar',
      missingCredentials: 'Forneça tanto a Chave API quanto o Segredo',
      linkedSuccess: 'Conta Bitso conectada com sucesso com {{count}} criptomoeda',
      linkedSuccess_plural: 'Conta Bitso conectada com sucesso com {{count}} criptomoedas',
      connectFailed: 'Erro ao conectar conta Bitso',
    },
  },
} as const;
