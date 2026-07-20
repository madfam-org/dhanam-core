export const apiErrors = {
  AUTH_INVALID_CREDENTIALS: 'E-mail ou senha incorretos',
  AUTH_ACCOUNT_LOCKED:
    'Sua conta foi bloqueada por segurança. Por favor verifique seu e-mail para desbloqueá-la',
  AUTH_SESSION_EXPIRED: 'Sua sessão expirou. Por favor faça login novamente',
  AUTH_TOKEN_INVALID: 'Token de autenticação inválido',
  AUTH_TOKEN_EXPIRED: 'O token de autenticação expirou',
  AUTH_TOTP_REQUIRED: 'Código de autenticação de dois fatores é necessário',
  AUTH_TOTP_INVALID: 'Código de autenticação inválido ou expirado',
  AUTH_TOO_MANY_ATTEMPTS: 'Muitas tentativas falhas. Por favor tente novamente mais tarde',
  VALIDATION_FAILED: 'Erro de validação. Por favor verifique os dados informados',
  VALIDATION_REQUIRED_FIELD: 'Este campo é obrigatório',
  RESOURCE_NOT_FOUND: 'O recurso solicitado não existe',
  RESOURCE_ALREADY_EXISTS: 'Este recurso já existe',
  RESOURCE_IN_USE: 'Este recurso está sendo utilizado e não pode ser excluído',
  PERMISSION_DENIED: 'Você não tem permissão para realizar esta ação',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes para acessar este recurso',
  PROVIDER_ERROR: 'Erro ao conectar com o provedor financeiro',
  PROVIDER_UNAVAILABLE: 'O provedor financeiro não está disponível temporariamente',
  PROVIDER_SYNC_FAILED: 'Erro ao sincronizar dados do provedor',
  RATE_LIMIT_EXCEEDED: 'Você excedeu o limite de requisições. Por favor tente novamente mais tarde',
  INTERNAL_ERROR: 'Erro interno do servidor. Nossa equipe foi notificada',
  DATABASE_ERROR: 'Erro de banco de dados. Por favor tente novamente',
  BUDGET_EXCEEDED: 'Você excedeu o limite do seu orçamento',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  ACCOUNT_INACTIVE: 'Esta conta está inativa',
  FEATURE_NOT_AVAILABLE: 'Esta função não está disponível no seu plano atual',
  FILE_TOO_LARGE: 'O arquivo é muito grande. Tamanho máximo permitido: {{maxSize}}',
  INVALID_FILE_TYPE: 'Tipo de arquivo não permitido. Formatos aceitos: {{allowedTypes}}',

  // Connection health: rate limit
  CONN_RATE_LIMIT_TITLE: 'Sincronização pausada temporariamente',
  CONN_RATE_LIMIT_MESSAGE:
    'Fizemos muitas requisições ao {{provider}} em pouco tempo. Isso é normal e será resolvido automaticamente.',
  CONN_RATE_LIMIT_ACTION: 'Aguarde alguns minutos antes de tentar novamente.',
  CONN_RATE_LIMIT_BUTTON: 'Tentar sincronização novamente',

  // Connection health: authentication
  CONN_AUTH_TITLE: 'Reconexão necessária',
  CONN_AUTH_MESSAGE:
    'Sua conexão com {{provider}} precisa ser atualizada. Isso acontece periodicamente por segurança.',
  CONN_AUTH_ACTION:
    'Por favor reconecte sua conta para continuar sincronizando. Seu histórico de transações será preservado.',
  CONN_AUTH_BUTTON: 'Reconectar conta',

  // Connection health: connection error
  CONN_CONNECTION_TITLE: 'Problema de conexão',
  CONN_CONNECTION_MESSAGE:
    'Estamos com dificuldades para acessar {{provider}}. Geralmente é um problema temporário de rede.',
  CONN_CONNECTION_ACTION:
    'Verifique sua conexão com a internet e tente novamente em alguns minutos.',
  CONN_CONNECTION_BUTTON: 'Tentar novamente',

  // Connection health: timeout
  CONN_TIMEOUT_TITLE: 'Sincronização demorando mais que o esperado',
  CONN_TIMEOUT_MESSAGE:
    '{{provider}} está demorando mais que o normal para responder. Seus dados estão seguros.',
  CONN_TIMEOUT_ACTION: 'Tentaremos novamente automaticamente. Você também pode tentar manualmente.',
  CONN_TIMEOUT_BUTTON: 'Tentar sincronização novamente',

  // Connection health: maintenance
  CONN_MAINTENANCE_TITLE: 'Manutenção programada',
  CONN_MAINTENANCE_MESSAGE:
    '{{provider}} está em manutenção. A sincronização será retomada automaticamente ao término.',
  CONN_MAINTENANCE_ACTION:
    'Nenhuma ação necessária. Sincronizaremos seus dados quando o serviço voltar.',
  CONN_MAINTENANCE_BUTTON: 'Ver status',

  // Connection health: institution error
  CONN_INSTITUTION_TITLE: 'Problema com a instituição bancária',
  CONN_INSTITUTION_MESSAGE:
    'Seu banco ou instituição está com dificuldades técnicas. O problema é deles, não seu.',
  CONN_INSTITUTION_ACTION:
    'Aguarde a instituição resolver o problema. Você pode tentar reconectar se o problema persistir.',
  CONN_INSTITUTION_BUTTON: 'Ver status',

  // Connection health: default error
  CONN_DEFAULT_TITLE: 'Problema de sincronização',
  CONN_DEFAULT_MESSAGE: 'Encontramos um problema ao sincronizar com {{provider}}.',
  CONN_DEFAULT_ACTION:
    'Tente atualizar a conexão. Se o problema persistir, entre em contato com o suporte.',
  CONN_DEFAULT_BUTTON: 'Tentar novamente',

  // Connection health: summary messages
  CONN_SUMMARY_ALL_HEALTHY: 'Todas as contas estão sincronizando normalmente.',
  CONN_SUMMARY_REAUTH: '{{count}} conta(s) precisam de reconexão.',
  CONN_SUMMARY_ERRORS: '{{count}} conta(s) têm erros de sincronização.',
  CONN_SUMMARY_DEGRADED: '{{count}} conta(s) estão com atrasos.',
  CONN_SUMMARY_MIXED: '{{reauth}} reconexão(ões), {{errors}} erro(s), {{degraded}} atraso(s).',

  // Connection health: status text (summary endpoint)
  CONN_STATUS_ALL_HEALTHY: 'Todas as conexões saudáveis',
  CONN_STATUS_NEED_ATTENTION: '{{count}} conexão(ões) precisam de atenção',
  CONN_STATUS_DEGRADED: '{{count}} conexão(ões) degradadas',

  // Sync status UI
  SYNC_STATUS_TITLE: 'Status da sincronização',
  SYNC_STATUS_LAST_UPDATED: 'Última atualização {{time}}',
  SYNC_STATUS_NEXT_SYNC: 'Próxima sincronização {{time}}',
  SYNC_STATUS_SYNC_NOW: 'Sincronizar agora',
  SYNC_STATUS_ACCOUNT_CONNECTIONS: 'Conexões de contas',
  SYNC_STATUS_LAST_SYNC: 'Última sincronização {{time}}',
  SYNC_STATUS_CONNECTED: 'Conectado',
  SYNC_STATUS_SYNCING: 'Sincronizando',
  SYNC_STATUS_ERROR: 'Erro',
  SYNC_STATUS_UNKNOWN: 'Desconhecido',
  SYNC_STATUS_RECONNECT: 'Reconectar',
  SYNC_STATUS_CONNECTED_COUNT: 'Conectados',
  SYNC_STATUS_NEED_ATTENTION: 'Precisam de atenção',
  SYNC_STATUS_SYNCING_COUNT: 'Sincronizando',
} as const;
