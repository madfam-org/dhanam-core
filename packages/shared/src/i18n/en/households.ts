/**
 * English Households Translations
 * Terms for multi-generational family planning
 */
export const households = {
  // General Terms
  household: 'Household',
  households: 'Households',
  householdMember: 'Household Member',
  householdMembers: 'Household Members',
  multiGenerationalPlanning: 'Multi-Generational Planning',

  // Household Types
  types: {
    family: 'Family',
    individual: 'Individual',
    trust: 'Trust',
    estate: 'Estate',
    partnership: 'Partnership',
  },

  // Relationship Types
  relationships: {
    spouse: 'Spouse',
    child: 'Child',
    parent: 'Parent',
    grandparent: 'Grandparent',
    grandchild: 'Grandchild',
    sibling: 'Sibling',
    other: 'Other',
  },

  // Actions
  createHousehold: 'Create Household',
  updateHousehold: 'Update Household',
  deleteHousehold: 'Delete Household',
  viewHousehold: 'View Household',

  addMember: 'Add Member',
  updateMember: 'Update Member',
  removeMember: 'Remove Member',

  switchHousehold: 'Switch Household',

  // Form Fields
  householdName: 'Household Name',
  householdNamePlaceholder: 'e.g., Smith Family',
  householdType: 'Household Type',
  baseCurrency: 'Base Currency',
  description: 'Description',
  descriptionPlaceholder: 'Household description (optional)',
  descriptionOptional: 'Description (Optional)',

  memberName: 'Member Name',
  relationship: 'Relationship',
  isMinor: 'Is Minor',
  dateOfBirth: 'Date of Birth',
  accessStartDate: 'Access Start Date',
  accessStartDateOptional: 'Access Start Date (Optional)',

  // Labels & Headers
  householdDetails: 'Household Details',
  householdManagement: 'Household Management',
  memberManagement: 'Member Management',

  netWorth: 'Net Worth',
  householdNetWorth: 'Household Net Worth',
  totalNetWorth: 'Total Net Worth',

  assets: 'Assets',
  liabilities: 'Liabilities',
  bySpace: 'By Space',

  goals: 'Goals',
  householdGoals: 'Household Goals',
  goalSummary: 'Goal Summary',
  totalGoals: 'Total Goals',
  activeGoals: 'Active Goals',
  achievedGoals: 'Achieved Goals',
  totalTargetAmount: 'Total Target Amount',
  byType: 'By Type',

  // Messages & Alerts
  noHouseholdsYet: 'No Households Yet',
  noHouseholdsDescription: 'Create your first household to begin family planning',

  noMembersYet: 'No Members Yet',
  noMembersDescription: 'Add members to your household to begin multi-generational planning',

  householdCreatedSuccess: 'Household created successfully',
  householdUpdatedSuccess: 'Household updated successfully',
  householdDeletedSuccess: 'Household deleted successfully',

  memberAddedSuccess: 'Member added successfully',
  memberUpdatedSuccess: 'Member updated successfully',
  memberRemovedSuccess: 'Member removed successfully',

  // Errors
  householdNotFound: 'Household not found',
  noAccessToHousehold: 'You do not have access to this household',
  memberNotFound: 'Member not found',

  cannotDeleteHouseholdWithSpaces: 'Cannot delete household with linked spaces',
  cannotDeleteHouseholdWithGoals: 'Cannot delete household with active goals',
  cannotRemoveLastMember: 'Cannot remove the last household member',

  userNotFound: 'User not found',
  memberAlreadyExists: 'User is already a member of this household',
  mustBeMember: 'You must be a household member',

  // Descriptions
  createHouseholdDescription: 'Create a new household for family financial planning',
  familyHousehold: 'A traditional nuclear or extended household',
  individualHousehold: 'Individual planning without other members',
  trustHousehold: 'A trust or legal vehicle',
  estateHousehold: 'Estate planning for wealth management',

  // Net Worth Details
  netWorthCalculation: 'Net Worth Calculation',
  includesAllSpaces: 'Includes all spaces linked to this household',
  assetAllocation: 'Asset Allocation',
  liabilityBreakdown: 'Liability Breakdown',

  // Goal Details
  retirementGoals: 'Retirement Goals',
  educationGoals: 'Education Goals',
  savingsGoals: 'Savings Goals',
  investmentGoals: 'Investment Goals',

  // Member Details
  memberCount: '{count} members',
  minorMember: 'Minor',
  adultMember: 'Adult',

  accessGrantedOn: 'Access Granted On',
  joinedOn: 'Joined On',

  // Tooltips & Help
  whatIsHousehold: 'What is a household?',
  householdExplanation:
    'A household is a group of people who share financial planning, such as a family, trust, or estate.',

  multiGenPlanningHelp:
    'Multi-generational planning helps you coordinate financial goals across multiple generations',

  minorAccessHelp: 'Minors have limited access until they reach adulthood',

  currencyHelp: 'The base currency is used for all net worth calculations for this household',

  // Page-level keys (used by households page component)
  page: {
    title: 'Households',
    description: 'Manage multi-generational family financial planning',
    createHousehold: 'Create Household',
  },
  dialog: {
    createTitle: 'Create New Household',
    createDescription: 'Create a household to organize multi-generational financial planning',
  },
  fields: {
    name: 'Name',
    namePlaceholder: 'Smith Family',
    type: 'Type',
    baseCurrency: 'Base Currency',
    descriptionOptional: 'Description (Optional)',
    descriptionPlaceholder: 'Main family household',
  },
  empty: {
    title: 'No Households Yet',
    description: 'Create your first household to start multi-generational planning',
  },
  detail: {
    totalNetWorth: 'Total Net Worth',
    goalsSummary: 'Goals Summary',
    totalGoals: 'Total Goals:',
    active: 'Active:',
    achieved: 'Achieved:',
    targetAmount: 'Target Amount:',
    members: 'Members',
    minor: 'Minor',
    yoursMineOurs: 'Yours, Mine & Ours',
    ownershipDescription:
      'View your household finances by ownership. Filter accounts between individual and joint ownership.',
    yourAccounts: 'Your Accounts',
    partnerAccounts: "Partner's Accounts",
    jointAccounts: 'Joint Accounts',
    allAccounts: 'All Accounts',
  },
  labels: {
    members: 'Members:',
    spaces: 'Spaces:',
    goals: 'Goals:',
  },
  actions: {
    cancel: 'Cancel',
    create: 'Create',
  },

  // Currencies
  currencies: {
    USD: 'US Dollar (USD)',
    MXN: 'Mexican Peso (MXN)',
    EUR: 'Euro (EUR)',
  },
};
