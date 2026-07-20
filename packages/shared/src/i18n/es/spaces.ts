/**
 * Spanish Spaces Translations
 * Workspaces, organizations, multi-tenant features
 */
export const spaces = {
  // Main
  spaces: 'Espacios',
  space: 'Espacio',
  mySpaces: 'Mis espacios',
  createSpace: 'Crear espacio',
  newSpace: 'Nuevo espacio',
  editSpace: 'Editar espacio',
  deleteSpace: 'Eliminar espacio',
  spaceDetails: 'Detalles del espacio',
  switchSpace: 'Cambiar espacio',
  currentSpace: 'Espacio actual',

  // Types
  personal: 'Personal',
  business: 'Negocio',
  family: 'Familiar',
  shared: 'Compartido',

  // Fields
  spaceName: 'Nombre del espacio',
  spaceType: 'Tipo de espacio',
  description: 'Descripción',
  currency: 'Moneda',
  timezone: 'Zona horaria',
  logo: 'Logotipo',
  color: 'Color',

  // Members
  members: 'Miembros',
  member: 'Miembro',
  inviteMembers: 'Invitar miembros',
  addMember: 'Agregar miembro',
  removeMember: 'Quitar miembro',
  memberCount: '{{count}} miembros',
  noMembers: 'Sin miembros',

  // Roles
  owner: 'Propietario',
  admin: 'Administrador',
  memberRole: 'Miembro',
  viewer: 'Visualizador',
  role: 'Rol',
  changeRole: 'Cambiar rol',
  permissions: 'Permisos',

  // Invitations
  invitations: 'Invitaciones',
  invitation: 'Invitación',
  sendInvitation: 'Enviar invitación',
  acceptInvitation: 'Aceptar invitación',
  declineInvitation: 'Rechazar invitación',
  cancelInvitation: 'Cancelar invitación',
  pendingInvitation: 'Invitación pendiente',
  invitationSent: 'Invitación enviada',
  invitationAccepted: 'Invitación aceptada',
  invitationDeclined: 'Invitación rechazada',
  inviteByEmail: 'Invitar por correo',
  enterEmail: 'Ingresa correo electrónico',

  // Settings
  spaceSettings: 'Configuración del espacio',
  generalSettings: 'Configuración general',
  memberSettings: 'Configuración de miembros',
  securitySettings: 'Configuración de seguridad',

  // Actions
  leaveSpace: 'Abandonar espacio',
  transferOwnership: 'Transferir propiedad',
  archiveSpace: 'Archivar espacio',
  restoreSpace: 'Restaurar espacio',
  duplicateSpace: 'Duplicar espacio',

  // Messages
  noSpaces: 'No tienes espacios',
  createFirstSpace: 'Crea tu primer espacio',
  spaceCreated: 'Espacio creado',
  spaceUpdated: 'Espacio actualizado',
  spaceDeleted: 'Espacio eliminado',
  memberAdded: 'Miembro agregado',
  memberRemoved: 'Miembro quitado',
  roleChanged: 'Rol cambiado',
  leftSpace: 'Has abandonado el espacio',
  ownershipTransferred: 'Propiedad transferida',

  // Confirmations
  confirmDelete: '¿Eliminar este espacio?',
  confirmLeave: '¿Abandonar este espacio?',
  confirmTransfer: '¿Transferir la propiedad a {{member}}?',
  deleteWarning: 'Se eliminarán todos los datos, cuentas y transacciones',
  leaveWarning: 'Perderás acceso a todos los datos de este espacio',
  transferWarning: 'Ya no serás el propietario de este espacio',

  // Errors
  spaceNotFound: 'Espacio no encontrado',
  spaceNameRequired: 'El nombre del espacio es requerido',
  spaceTypeRequired: 'El tipo de espacio es requerido',
  currencyRequired: 'La moneda es requerida',
  timezoneRequired: 'La zona horaria es requerida',
  cannotDeleteLastSpace: 'No puedes eliminar tu último espacio',
  cannotLeaveAsOwner: 'No puedes abandonar siendo propietario',
  memberNotFound: 'Miembro no encontrado',
  alreadyMember: 'Ya es miembro',
  invitationNotFound: 'Invitación no encontrada',
  noPermission: 'No tienes permiso',

  // Permissions
  canView: 'Puede ver',
  canEdit: 'Puede editar',
  canDelete: 'Puede eliminar',
  canManageMembers: 'Puede administrar miembros',
  canManageSettings: 'Puede administrar configuración',
  canInvite: 'Puede invitar',
  fullAccess: 'Acceso completo',
  readOnly: 'Solo lectura',
} as const;
