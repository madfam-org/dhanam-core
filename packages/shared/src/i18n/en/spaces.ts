/**
 * English Spaces Translations
 * Workspaces, organizations, multi-tenant features
 */
export const spaces = {
  // Main
  spaces: 'Spaces',
  space: 'Space',
  mySpaces: 'My spaces',
  createSpace: 'Create space',
  newSpace: 'New space',
  editSpace: 'Edit space',
  deleteSpace: 'Delete space',
  spaceDetails: 'Space details',
  switchSpace: 'Switch space',
  currentSpace: 'Current space',

  // Types
  personal: 'Personal',
  business: 'Business',
  family: 'Family',
  shared: 'Shared',

  // Fields
  spaceName: 'Space name',
  spaceType: 'Space type',
  description: 'Description',
  currency: 'Currency',
  timezone: 'Timezone',
  logo: 'Logo',
  color: 'Color',

  // Members
  members: 'Members',
  member: 'Member',
  inviteMembers: 'Invite members',
  addMember: 'Add member',
  removeMember: 'Remove member',
  memberCount: '{{count}} members',
  noMembers: 'No members',

  // Roles
  owner: 'Owner',
  admin: 'Admin',
  memberRole: 'Member',
  viewer: 'Viewer',
  role: 'Role',
  changeRole: 'Change role',
  permissions: 'Permissions',

  // Invitations
  invitations: 'Invitations',
  invitation: 'Invitation',
  sendInvitation: 'Send invitation',
  acceptInvitation: 'Accept invitation',
  declineInvitation: 'Decline invitation',
  cancelInvitation: 'Cancel invitation',
  pendingInvitation: 'Pending invitation',
  invitationSent: 'Invitation sent',
  invitationAccepted: 'Invitation accepted',
  invitationDeclined: 'Invitation declined',
  inviteByEmail: 'Invite by email',
  enterEmail: 'Enter email',

  // Settings
  spaceSettings: 'Space settings',
  generalSettings: 'General settings',
  memberSettings: 'Member settings',
  securitySettings: 'Security settings',

  // Actions
  leaveSpace: 'Leave space',
  transferOwnership: 'Transfer ownership',
  archiveSpace: 'Archive space',
  restoreSpace: 'Restore space',
  duplicateSpace: 'Duplicate space',

  // Messages
  noSpaces: 'You have no spaces',
  createFirstSpace: 'Create your first space',
  spaceCreated: 'Space created',
  spaceUpdated: 'Space updated',
  spaceDeleted: 'Space deleted',
  memberAdded: 'Member added',
  memberRemoved: 'Member removed',
  roleChanged: 'Role changed',
  leftSpace: 'You have left the space',
  ownershipTransferred: 'Ownership transferred',

  // Confirmations
  confirmDelete: 'Delete this space?',
  confirmLeave: 'Leave this space?',
  confirmTransfer: 'Transfer ownership to {{member}}?',
  deleteWarning: 'All data, accounts, and transactions will be deleted',
  leaveWarning: 'You will lose access to all data in this space',
  transferWarning: 'You will no longer be the owner of this space',

  // Errors
  spaceNotFound: 'Space not found',
  spaceNameRequired: 'Space name is required',
  spaceTypeRequired: 'Space type is required',
  currencyRequired: 'Currency is required',
  timezoneRequired: 'Timezone is required',
  cannotDeleteLastSpace: 'Cannot delete your last space',
  cannotLeaveAsOwner: 'Cannot leave as owner',
  memberNotFound: 'Member not found',
  alreadyMember: 'Already a member',
  invitationNotFound: 'Invitation not found',
  noPermission: 'You do not have permission',

  // Permissions
  canView: 'Can view',
  canEdit: 'Can edit',
  canDelete: 'Can delete',
  canManageMembers: 'Can manage members',
  canManageSettings: 'Can manage settings',
  canInvite: 'Can invite',
  fullAccess: 'Full access',
  readOnly: 'Read only',
} as const;
