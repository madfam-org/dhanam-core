/**
 * Brazilian Portuguese Households Translations
 * Terms for multi-generational family planning
 */
export const households = {
  // General Terms
  household: 'Lar',
  households: 'Lares',
  householdMember: 'Membro do Lar',
  householdMembers: 'Membros do Lar',
  multiGenerationalPlanning: 'Planejamento Multigeracional',

  // Household Types
  types: {
    family: 'Família',
    individual: 'Individual',
    trust: 'Fideicomisso',
    estate: 'Patrimônio',
    partnership: 'Sociedade',
  },

  // Relationship Types
  relationships: {
    spouse: 'Cônjuge',
    child: 'Filho(a)',
    parent: 'Pai/Mãe',
    grandparent: 'Avô/Avó',
    grandchild: 'Neto(a)',
    sibling: 'Irmão/Irmã',
    other: 'Outro',
  },

  // Actions
  createHousehold: 'Criar Lar',
  updateHousehold: 'Atualizar Lar',
  deleteHousehold: 'Excluir Lar',
  viewHousehold: 'Ver Lar',

  addMember: 'Adicionar Membro',
  updateMember: 'Atualizar Membro',
  removeMember: 'Remover Membro',

  switchHousehold: 'Trocar de Lar',

  // Form Fields
  householdName: 'Nome do Lar',
  householdNamePlaceholder: 'ex., Família Silva',
  householdType: 'Tipo de Lar',
  baseCurrency: 'Moeda Base',
  description: 'Descrição',
  descriptionPlaceholder: 'Descrição do lar (opcional)',
  descriptionOptional: 'Descrição (Opcional)',

  memberName: 'Nome do Membro',
  relationship: 'Relacionamento',
  isMinor: 'É Menor de Idade',
  dateOfBirth: 'Data de Nascimento',
  accessStartDate: 'Data de Início de Acesso',
  accessStartDateOptional: 'Data de Início de Acesso (Opcional)',

  // Labels & Headers
  householdDetails: 'Detalhes do Lar',
  householdManagement: 'Gestão do Lar',
  memberManagement: 'Gestão de Membros',

  netWorth: 'Patrimônio Líquido',
  householdNetWorth: 'Patrimônio Líquido do Lar',
  totalNetWorth: 'Patrimônio Líquido Total',

  assets: 'Ativos',
  liabilities: 'Passivos',
  bySpace: 'Por Espaço',

  goals: 'Objetivos',
  householdGoals: 'Objetivos do Lar',
  goalSummary: 'Resumo de Objetivos',
  totalGoals: 'Total de Objetivos',
  activeGoals: 'Objetivos Ativos',
  achievedGoals: 'Objetivos Alcançados',
  totalTargetAmount: 'Valor Alvo Total',
  byType: 'Por Tipo',

  // Messages & Alerts
  noHouseholdsYet: 'Ainda Não Há Lares',
  noHouseholdsDescription: 'Crie seu primeiro lar para começar o planejamento familiar',

  noMembersYet: 'Ainda Não Há Membros',
  noMembersDescription: 'Adicione membros ao seu lar para começar o planejamento multigeracional',

  householdCreatedSuccess: 'Lar criado com sucesso',
  householdUpdatedSuccess: 'Lar atualizado com sucesso',
  householdDeletedSuccess: 'Lar excluído com sucesso',

  memberAddedSuccess: 'Membro adicionado com sucesso',
  memberUpdatedSuccess: 'Membro atualizado com sucesso',
  memberRemovedSuccess: 'Membro removido com sucesso',

  // Errors
  householdNotFound: 'Lar não encontrado',
  noAccessToHousehold: 'Você não tem acesso a este lar',
  memberNotFound: 'Membro não encontrado',

  cannotDeleteHouseholdWithSpaces: 'Não é possível excluir um lar com espaços vinculados',
  cannotDeleteHouseholdWithGoals: 'Não é possível excluir um lar com objetivos ativos',
  cannotRemoveLastMember: 'Não é possível remover o último membro do lar',

  userNotFound: 'Usuário não encontrado',
  memberAlreadyExists: 'O usuário já é membro deste lar',
  mustBeMember: 'Você deve ser membro do lar',

  // Descriptions
  createHouseholdDescription: 'Crie um novo lar para o planejamento financeiro familiar',
  familyHousehold: 'Um lar nuclear ou estendido tradicional',
  individualHousehold: 'Planejamento individual sem outros membros',
  trustHousehold: 'Um fideicomisso ou veículo legal',
  estateHousehold: 'Planejamento patrimonial para administração de bens',

  // Net Worth Details
  netWorthCalculation: 'Cálculo do Patrimônio Líquido',
  includesAllSpaces: 'Inclui todos os espaços vinculados a este lar',
  assetAllocation: 'Alocação de Ativos',
  liabilityBreakdown: 'Detalhamento de Passivos',

  // Goal Details
  retirementGoals: 'Objetivos de Aposentadoria',
  educationGoals: 'Objetivos de Educação',
  savingsGoals: 'Objetivos de Poupança',
  investmentGoals: 'Objetivos de Investimento',

  // Member Details
  memberCount: '{count} membros',
  minorMember: 'Menor de Idade',
  adultMember: 'Adulto',

  accessGrantedOn: 'Acesso Concedido em',
  joinedOn: 'Entrou em',

  // Tooltips & Help
  whatIsHousehold: 'O que é um lar?',
  householdExplanation:
    'Um lar é um grupo de pessoas que compartilham planejamento financeiro, como uma família, fideicomisso ou patrimônio.',

  multiGenPlanningHelp:
    'O planejamento multigeracional ajuda a coordenar objetivos financeiros em múltiplas gerações',

  minorAccessHelp: 'Os menores têm acesso limitado até atingirem a maioridade',

  currencyHelp: 'A moeda base é utilizada para todos os cálculos de patrimônio líquido deste lar',

  // Page-level keys (used by households page component)
  page: {
    title: 'Lares',
    description: 'Gerencie o planejamento financeiro familiar multigeracional',
    createHousehold: 'Criar lar',
  },
  dialog: {
    createTitle: 'Criar novo lar',
    createDescription: 'Crie um lar para organizar o planejamento financeiro multigeracional',
  },
  fields: {
    name: 'Nome',
    namePlaceholder: 'Família Silva',
    type: 'Tipo',
    baseCurrency: 'Moeda base',
    descriptionOptional: 'Descrição (Opcional)',
    descriptionPlaceholder: 'Lar familiar principal',
  },
  empty: {
    title: 'Ainda não há lares',
    description: 'Crie seu primeiro lar para começar o planejamento multigeracional',
  },
  detail: {
    totalNetWorth: 'Patrimônio líquido total',
    goalsSummary: 'Resumo de objetivos',
    totalGoals: 'Total de objetivos:',
    active: 'Ativos:',
    achieved: 'Alcançados:',
    targetAmount: 'Valor alvo:',
    members: 'Membros',
    minor: 'Menor de idade',
    yoursMineOurs: 'Seu, meu e nosso',
    ownershipDescription:
      'Visualize as finanças do lar por titularidade. Filtre contas entre propriedade individual e conjunta.',
    yourAccounts: 'Suas contas',
    partnerAccounts: 'Contas do parceiro(a)',
    jointAccounts: 'Contas conjuntas',
    allAccounts: 'Todas as contas',
  },
  labels: {
    members: 'Membros:',
    spaces: 'Espaços:',
    goals: 'Objetivos:',
  },
  actions: {
    cancel: 'Cancelar',
    create: 'Criar',
  },

  // Currencies
  currencies: {
    USD: 'Dólar Americano (USD)',
    MXN: 'Peso Mexicano (MXN)',
    EUR: 'Euro (EUR)',
  },
};
