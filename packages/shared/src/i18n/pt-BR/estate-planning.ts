/**
 * Brazilian Portuguese Estate Planning Translations
 * Terms and phrases for digital wills and beneficiary management
 */
export const estatePlanning = {
  // General Terms
  estatePlanning: 'Planejamento Patrimonial',
  will: 'Testamento',
  wills: 'Testamentos',
  digitalWill: 'Testamento Digital',
  beneficiary: 'Beneficiário',
  beneficiaries: 'Beneficiários',
  executor: 'Executor',
  executors: 'Executores',

  // Will Status
  status: {
    draft: 'Rascunho',
    active: 'Ativo',
    revoked: 'Revogado',
    executed: 'Executado',
  },

  // Asset Types
  assetTypes: {
    bank_account: 'Conta Bancária',
    investment_account: 'Conta de Investimento',
    crypto_account: 'Conta de Criptomoedas',
    real_estate: 'Imóveis',
    business_interest: 'Participação Societária',
    personal_property: 'Propriedade Pessoal',
    other: 'Outro',
  },

  // Actions
  createWill: 'Criar Testamento',
  updateWill: 'Atualizar Testamento',
  deleteWill: 'Excluir Testamento',
  activateWill: 'Ativar Testamento',
  revokeWill: 'Revogar Testamento',
  viewWill: 'Ver Testamento',

  addBeneficiary: 'Adicionar Beneficiário',
  updateBeneficiary: 'Atualizar Beneficiário',
  removeBeneficiary: 'Remover Beneficiário',

  addExecutor: 'Adicionar Executor',
  updateExecutor: 'Atualizar Executor',
  removeExecutor: 'Remover Executor',

  validate: 'Validar',
  validateWill: 'Validar Testamento',

  // Form Fields
  willName: 'Nome do Testamento',
  willNamePlaceholder: 'ex., Testamento Familiar Silva 2025',
  notes: 'Notas',
  notesPlaceholder: 'Notas ou instruções adicionais',
  notesOptional: 'Notas (Opcional)',

  legalDisclaimer: 'Aviso Legal',
  legalDisclaimerText:
    'Entendo que este é um testamento digital e devo consultar um assessor jurídico',
  acceptLegalDisclaimer: 'Aceito o aviso legal',

  percentage: 'Porcentagem',
  percentageAllocation: 'Distribuição Percentual',
  assetType: 'Tipo de Ativo',
  specificAsset: 'Ativo Específico',
  specificAssetOptional: 'Ativo Específico (Opcional)',

  primaryExecutor: 'Executor Principal',
  executorOrder: 'Ordem de Execução',
  isPrimary: 'É Principal',

  conditions: 'Condições',
  conditionsOptional: 'Condições (Opcional)',

  // Labels & Headers
  willDetails: 'Detalhes do Testamento',
  willManagement: 'Gestão do Testamento',
  beneficiaryAllocation: 'Distribuição de Beneficiários',
  executorManagement: 'Gestão de Executores',

  beneficiaryCount: 'Beneficiários',
  executorCount: 'Executores',

  activatedAt: 'Ativado',
  revokedAt: 'Revogado',
  executedAt: 'Executado',
  lastReviewed: 'Última Revisão',

  // Messages & Alerts
  noWillsYet: 'Ainda Não Há Testamentos',
  noWillsDescription:
    'Crie seu primeiro testamento para começar o planejamento patrimonial do seu lar',

  cannotActivateWill: 'Não é possível ativar o testamento',
  validationErrors: 'Erros de Validação',

  mustHaveBeneficiaries: 'Deve ter pelo menos um beneficiário',
  mustHaveExecutors: 'Deve ter pelo menos um executor',
  mustAcceptDisclaimer: 'Você deve aceitar o aviso legal antes da ativação',

  allocationMustBe100: 'As distribuições devem somar 100% por tipo de ativo',
  allocationInvalid: 'As distribuições de beneficiários são inválidas',

  willCreatedSuccess: 'Testamento criado com sucesso',
  willUpdatedSuccess: 'Testamento atualizado com sucesso',
  willDeletedSuccess: 'Testamento excluído com sucesso',
  willActivatedSuccess: 'Testamento ativado com sucesso',
  willRevokedSuccess: 'Testamento revogado com sucesso',

  beneficiaryAddedSuccess: 'Beneficiário adicionado com sucesso',
  beneficiaryUpdatedSuccess: 'Beneficiário atualizado com sucesso',
  beneficiaryRemovedSuccess: 'Beneficiário removido com sucesso',

  executorAddedSuccess: 'Executor adicionado com sucesso',
  executorUpdatedSuccess: 'Executor atualizado com sucesso',
  executorRemovedSuccess: 'Executor removido com sucesso',

  // Errors
  willNotFound: 'Testamento não encontrado',
  noAccessToWill: 'Você não tem acesso a este testamento',
  beneficiaryNotFound: 'Beneficiário não encontrado',
  executorNotFound: 'Executor não encontrado',

  cannotUpdateActiveWill: 'Não é possível atualizar um testamento ativo',
  cannotDeleteActiveWill:
    'Não é possível excluir um testamento ativo. Revogue os testamentos ativos primeiro.',
  cannotModifyExecutedWill: 'Não é possível modificar um testamento executado',

  beneficiaryMustBeHouseholdMember: 'O beneficiário deve ser membro do lar',
  executorMustBeHouseholdMember: 'O executor deve ser membro do lar',

  previousWillAutoRevoked: 'O testamento ativo anterior foi revogado automaticamente',

  // Descriptions
  createWillDescription:
    'Crie um rascunho de testamento para seu lar. Você pode adicionar beneficiários e executores antes de ativá-lo.',
  activateWillDescription:
    'Ativar este testamento o tornará legalmente vinculante (sujeito a revisão legal)',
  revokeWillDescription:
    'Revogar este testamento o tornará inválido. Esta ação não pode ser desfeita.',

  draftWillsOnly: 'Somente testamentos em rascunho podem ser excluídos',
  oneActiveWillPerHousehold: 'Apenas um testamento ativo por lar',

  // Validation
  validationPassed: 'Validação aprovada',
  validationFailed: 'Validação falhou',

  // Tooltips & Help
  whatIsDigitalWill: 'O que é um testamento digital?',
  digitalWillExplanation:
    'Um testamento digital é uma ferramenta de planejamento patrimonial que ajuda a organizar a distribuição de ativos. Sempre consulte um assessor jurídico para validade legal.',

  beneficiaryAllocationHelp:
    'As distribuições percentuais devem somar 100% para cada tipo de ativo',
  executorOrderHelp:
    'O executor principal é responsável por executar o testamento. Os executores secundários servem como substitutos.',

  // Page-level keys (used by estate-planning page component)
  page: {
    title: 'Planejamento Patrimonial',
    description: 'Gerencie testamentos, beneficiários e planejamento de herança',
    createWill: 'Criar Testamento',
    createDraft: 'Criar Rascunho',
    noWills: 'Sem Testamentos Ainda',
    noWillsDescription:
      'Crie seu primeiro testamento para começar o planejamento patrimonial do seu lar',
    willDetails: 'Detalhes e Gestão do Testamento',
    noBeneficiaries: 'Sem beneficiários adicionados ainda',
    noExecutors: 'Sem executores designados ainda',
  },
  dialog: {
    createWill: {
      title: 'Criar Novo Testamento',
      description:
        'Crie um rascunho de testamento para seu lar. Você pode adicionar beneficiários e executores antes de ativá-lo.',
    },
  },
  fields: {
    willName: 'Nome do Testamento',
    willNamePlaceholder: 'ex., Testamento Família Silva 2025',
    notesOptional: 'Notas (Opcional)',
    notesPlaceholder: 'Notas ou instruções adicionais',
    legalDisclaimer:
      'Entendo que este é um testamento digital e devo consultar assessoria jurídica',
    beneficiaries: 'Beneficiários:',
    executors: 'Executores:',
    activated: 'Ativado:',
    primary: 'Principal',
    order: 'Ordem:',
  },
  actions: {
    activate: 'Ativar Testamento',
    revoke: 'Revogar Testamento',
    cancel: 'Cancelar',
    close: 'Fechar',
  },
  validation: {
    cannotActivate: 'Não é possível ativar o testamento:',
  },
  lifeBeat: {
    title: 'Life Beat',
    description: 'Sua rede de segurança financeira diante das incertezas da vida',
    protectionStatus: 'Status de Proteção',
    statusDescription:
      'Life Beat monitora sua atividade e alerta contatos de confiança se necessário',
    lastActivity: 'Última Atividade',
    daysAgo: 'há {{days}} dias',
    alertThresholds: 'Limites de Alerta',
    trustedExecutors: 'Executores de Confiança',
    pendingAlerts: 'Alertas Pendentes',
    pendingAlertsDescription:
      'Você tem {{count}} alerta(s) de inatividade pendente(s). Faça check-in para reiniciar seu temporizador.',
    checkIn: 'Estou Bem - Fazer Check-in Agora',
    disabled: {
      title: 'Life Beat está Desativado',
      description:
        'Ative o Life Beat para garantir que seus executores designados possam acessar suas informações financeiras se algo acontecer com você.',
      enable: 'Ativar Life Beat',
    },
    executors: {
      title: 'Executores Designados',
      description: 'Pessoas de confiança que podem acessar seu resumo financeiro',
      add: 'Adicionar Executor',
      empty: {
        title: 'Sem Executores Ainda',
        description:
          'Adicione pessoas de confiança que possam acessar suas informações financeiras.',
      },
      verified: 'Verificado',
      pending: 'Pendente',
      accessGranted: 'Acesso Concedido',
    },
    addDialog: {
      title: 'Adicionar Executor',
      description:
        'Adicione uma pessoa de confiança que possa acessar suas informações financeiras.',
      fullName: 'Nome Completo',
      namePlaceholder: 'João Silva',
      email: 'E-mail',
      emailPlaceholder: 'joao@exemplo.com',
      relationship: 'Relacionamento',
      relationships: {
        spouse: 'Cônjuge',
        child: 'Filho(a)',
        sibling: 'Irmão/Irmã',
        parent: 'Pai/Mãe',
        attorney: 'Advogado(a)',
        financialAdvisor: 'Consultor Financeiro',
        other: 'Outro',
      },
      cancel: 'Cancelar',
      submit: 'Adicionar Executor',
    },
    howItWorks: {
      title: 'Como Funciona o Life Beat',
      step1: {
        title: 'Monitoramento de Atividade',
        description: 'Acompanhamos seus logins e atividade. Se você estiver ativo, nada acontece.',
      },
      step2: {
        title: 'Alertas Escalonados',
        description: 'Após 30, 60, 90 dias de inatividade, enviamos lembretes de check-in.',
      },
      step3: {
        title: 'Acesso do Executor',
        description:
          'Se você não responder, seus executores podem solicitar acesso somente leitura.',
      },
    },
    enableDialog: {
      title: 'Ativar Proteção Life Beat',
      description: 'Configure seus limites de inatividade e aceite o aviso legal.',
      thresholdLabel: 'Limites de Alerta (dias de inatividade)',
      days: '{{days}} dias',
      thresholdHint:
        'Você receberá lembretes em cada limite. Os executores são notificados no limite final.',
      legalTitle: 'Aviso Legal Importante',
      legalDescription:
        'Life Beat fornece acesso somente leitura a resumos financeiros. Não concede autoridade de transação, acesso a contas ou procuração. Este recurso é destinado apenas para fins informativos e deve complementar, não substituir, um planejamento patrimonial adequado com assessoria jurídica.',
      legalCheckbox:
        'Entendo que o Life Beat fornece visibilidade financeira somente leitura e não constitui procuração ou autoridade de acesso a contas. Aceito os Termos de Serviço deste recurso.',
      cancel: 'Cancelar',
      enable: 'Ativar Life Beat',
    },
  },
} as const;
