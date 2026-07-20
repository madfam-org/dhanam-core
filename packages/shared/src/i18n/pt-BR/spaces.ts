/**
 * Brazilian Portuguese Spaces Translations
 * Workspaces, organizations, multi-tenant features
 */
export const spaces = {
  // Main
  spaces: 'Espaços',
  space: 'Espaço',
  mySpaces: 'Meus espaços',
  createSpace: 'Criar espaço',
  newSpace: 'Novo espaço',
  editSpace: 'Editar espaço',
  deleteSpace: 'Excluir espaço',
  spaceDetails: 'Detalhes do espaço',
  switchSpace: 'Trocar espaço',
  currentSpace: 'Espaço atual',

  // Types
  personal: 'Pessoal',
  business: 'Negócio',
  family: 'Familiar',
  shared: 'Compartilhado',

  // Fields
  spaceName: 'Nome do espaço',
  spaceType: 'Tipo de espaço',
  description: 'Descrição',
  currency: 'Moeda',
  timezone: 'Fuso horário',
  logo: 'Logotipo',
  color: 'Cor',

  // Members
  members: 'Membros',
  member: 'Membro',
  inviteMembers: 'Convidar membros',
  addMember: 'Adicionar membro',
  removeMember: 'Remover membro',
  memberCount: '{{count}} membros',
  noMembers: 'Sem membros',

  // Roles
  owner: 'Proprietário',
  admin: 'Administrador',
  memberRole: 'Membro',
  viewer: 'Visualizador',
  role: 'Função',
  changeRole: 'Alterar função',
  permissions: 'Permissões',

  // Invitations
  invitations: 'Convites',
  invitation: 'Convite',
  sendInvitation: 'Enviar convite',
  acceptInvitation: 'Aceitar convite',
  declineInvitation: 'Recusar convite',
  cancelInvitation: 'Cancelar convite',
  pendingInvitation: 'Convite pendente',
  invitationSent: 'Convite enviado',
  invitationAccepted: 'Convite aceito',
  invitationDeclined: 'Convite recusado',
  inviteByEmail: 'Convidar por e-mail',
  enterEmail: 'Digite o e-mail',

  // Settings
  spaceSettings: 'Configurações do espaço',
  generalSettings: 'Configurações gerais',
  memberSettings: 'Configurações de membros',
  securitySettings: 'Configurações de segurança',

  // Actions
  leaveSpace: 'Sair do espaço',
  transferOwnership: 'Transferir propriedade',
  archiveSpace: 'Arquivar espaço',
  restoreSpace: 'Restaurar espaço',
  duplicateSpace: 'Duplicar espaço',

  // Messages
  noSpaces: 'Você não tem espaços',
  createFirstSpace: 'Crie seu primeiro espaço',
  spaceCreated: 'Espaço criado',
  spaceUpdated: 'Espaço atualizado',
  spaceDeleted: 'Espaço excluído',
  memberAdded: 'Membro adicionado',
  memberRemoved: 'Membro removido',
  roleChanged: 'Função alterada',
  leftSpace: 'Você saiu do espaço',
  ownershipTransferred: 'Propriedade transferida',

  // Confirmations
  confirmDelete: 'Excluir este espaço?',
  confirmLeave: 'Sair deste espaço?',
  confirmTransfer: 'Transferir a propriedade para {{member}}?',
  deleteWarning: 'Todos os dados, contas e transações serão excluídos',
  leaveWarning: 'Você perderá acesso a todos os dados deste espaço',
  transferWarning: 'Você não será mais o proprietário deste espaço',

  // Errors
  spaceNotFound: 'Espaço não encontrado',
  spaceNameRequired: 'O nome do espaço é obrigatório',
  spaceTypeRequired: 'O tipo de espaço é obrigatório',
  currencyRequired: 'A moeda é obrigatória',
  timezoneRequired: 'O fuso horário é obrigatório',
  cannotDeleteLastSpace: 'Você não pode excluir seu último espaço',
  cannotLeaveAsOwner: 'Você não pode sair sendo proprietário',
  memberNotFound: 'Membro não encontrado',
  alreadyMember: 'Já é membro',
  invitationNotFound: 'Convite não encontrado',
  noPermission: 'Você não tem permissão',

  // Permissions
  canView: 'Pode ver',
  canEdit: 'Pode editar',
  canDelete: 'Pode excluir',
  canManageMembers: 'Pode gerenciar membros',
  canManageSettings: 'Pode gerenciar configurações',
  canInvite: 'Pode convidar',
  fullAccess: 'Acesso completo',
  readOnly: 'Somente leitura',
} as const;
