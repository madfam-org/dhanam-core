/**
 * Brazilian Portuguese Error Messages
 * Validation errors, API errors, user-facing error messages
 */
export const errors = {
  // General
  unknownError: 'Erro desconhecido',
  somethingWentWrong: 'Algo deu errado',
  errorOccurred: 'Ocorreu um erro',
  tryAgainLater: 'Tente novamente mais tarde',
  contactSupport: 'Entre em contato com o suporte',

  // Validation
  required: 'Este campo é obrigatório',
  invalidEmail: 'E-mail inválido',
  invalidFormat: 'Formato inválido',
  invalidValue: 'Valor inválido',
  tooShort: 'Muito curto',
  tooLong: 'Muito longo',
  mustBePositive: 'Deve ser positivo',
  mustBeNegative: 'Deve ser negativo',
  mustBeNumber: 'Deve ser um número',
  mustBeInteger: 'Deve ser um inteiro',
  mustBeString: 'Deve ser texto',
  mustBeBoolean: 'Deve ser verdadeiro ou falso',
  mustBeDate: 'Deve ser uma data',
  mustBeInFuture: 'Deve ser uma data futura',
  mustBeInPast: 'Deve ser uma data passada',

  // String validation
  minLength: 'Mínimo de {{min}} caracteres',
  maxLength: 'Máximo de {{max}} caracteres',
  exactLength: 'Deve ter exatamente {{length}} caracteres',
  alphanumeric: 'Somente caracteres alfanuméricos',
  noSpaces: 'Espaços não são permitidos',

  // Number validation
  min: 'Mínimo {{min}}',
  max: 'Máximo {{max}}',
  between: 'Deve estar entre {{min}} e {{max}}',
  greaterThan: 'Deve ser maior que {{value}}',
  lessThan: 'Deve ser menor que {{value}}',

  // File validation
  fileRequired: 'Arquivo obrigatório',
  fileTooLarge: 'Arquivo muito grande',
  invalidFileType: 'Tipo de arquivo inválido',
  maxFileSize: 'Tamanho máximo: {{size}}',
  allowedTypes: 'Tipos permitidos: {{types}}',

  // Authentication
  invalidCredentials: 'Credenciais inválidas',
  accountNotFound: 'Conta não encontrada',
  emailAlreadyExists: 'O e-mail já está cadastrado',
  usernameAlreadyExists: 'O nome de usuário já existe',
  passwordTooWeak: 'A senha é muito fraca',
  passwordsDoNotMatch: 'As senhas não coincidem',
  accountDisabled: 'Conta desabilitada',
  accountLocked: 'Conta bloqueada',
  sessionExpired: 'Sessão expirada',
  unauthorized: 'Não autorizado',
  forbidden: 'Acesso negado',
  tooManyAttempts: 'Muitas tentativas',

  // Authorization
  noPermission: 'Você não tem permissão',
  insufficientPermissions: 'Permissões insuficientes',
  accessDenied: 'Acesso negado',
  notOwner: 'Você não é o proprietário',
  notMember: 'Você não é membro',
  roleRequired: 'O papel de {{role}} é necessário',

  // Not Found
  notFound: 'Não encontrado',
  userNotFound: 'Usuário não encontrado',
  transactionNotFound: 'Transação não encontrada',
  budgetNotFound: 'Orçamento não encontrado',
  categoryNotFound: 'Categoria não encontrada',
  spaceNotFound: 'Espaço não encontrado',
  resourceNotFound: 'Recurso não encontrado',
  pageNotFound: 'Página não encontrada',

  // Conflict
  alreadyExists: 'Já existe',
  duplicateEntry: 'Entrada duplicada',
  conflictDetected: 'Conflito detectado',

  // Business Logic
  insufficientBalance: 'Saldo insuficiente',
  accountInactive: 'Conta inativa',
  transactionPending: 'Transação pendente',
  budgetExceeded: 'Orçamento excedido',
  limitReached: 'Limite atingido',
  quotaExceeded: 'Cota excedida',
  invalidOperation: 'Operação inválida',
  cannotDeleteInUse: 'Não é possível excluir, está em uso',

  // Network
  networkError: 'Erro de rede',
  connectionLost: 'Conexão perdida',
  timeoutError: 'Tempo esgotado',
  serverError: 'Erro do servidor',
  serviceUnavailable: 'Serviço indisponível',
  maintenanceMode: 'Modo de manutenção',

  // Data
  dataCorrupted: 'Dados corrompidos',
  invalidData: 'Dados inválidos',
  dataMissing: 'Dados ausentes',
  parseError: 'Erro ao processar',
  encodingError: 'Erro de codificação',

  // Provider Integration
  providerError: 'Erro do provedor',
  connectionFailed: 'Conexão falhou',
  syncFailed: 'Sincronização falhou',
  providerUnavailable: 'Provedor indisponível',
  invalidToken: 'Token inválido',
  tokenExpired: 'Token expirado',
  apiError: 'Erro de API',
  rateLimitExceeded: 'Limite de requisições excedido',

  // Specific features
  importFailed: 'Importação falhou',
  exportFailed: 'Exportação falhou',
  uploadFailed: 'Envio falhou',
  downloadFailed: 'Download falhou',
  processingFailed: 'Processamento falhou',
  calculationError: 'Erro de cálculo',

  // Database
  databaseError: 'Erro de banco de dados',
  queryFailed: 'Consulta falhou',
  connectionError: 'Erro de conexão',
  transactionFailed: 'Transação falhou',
  constraintViolation: 'Violação de restrição',
  foreignKeyViolation: 'Violação de chave estrangeira',
  uniqueViolation: 'Violação de unicidade',

  // Crypto/ESG
  invalidAddress: 'Endereço inválido',
  invalidNetwork: 'Rede inválida',
  esgDataUnavailable: 'Dados ESG indisponíveis',
  priceDataUnavailable: 'Dados de preço indisponíveis',

  // Generic HTTP
  badRequest: 'Requisição inválida',
  internalServerError: 'Erro interno do servidor',
  notImplemented: 'Não implementado',

  // User actions
  cannotUndo: 'Não é possível desfazer',
  actionFailed: 'Ação falhou',
  saveFailed: 'Salvamento falhou',
  deleteFailed: 'Exclusão falhou',
  updateFailed: 'Atualização falhou',
  createFailed: 'Criação falhou',
} as const;
