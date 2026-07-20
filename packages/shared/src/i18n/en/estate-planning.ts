/**
 * English Estate Planning Translations
 * Terms and phrases for digital wills and beneficiary management
 */
export const estatePlanning = {
  // General Terms
  estatePlanning: 'Estate Planning',
  will: 'Will',
  wills: 'Wills',
  digitalWill: 'Digital Will',
  beneficiary: 'Beneficiary',
  beneficiaries: 'Beneficiaries',
  executor: 'Executor',
  executors: 'Executors',

  // Will Status
  status: {
    draft: 'Draft',
    active: 'Active',
    revoked: 'Revoked',
    executed: 'Executed',
  },

  // Asset Types
  assetTypes: {
    bank_account: 'Bank Account',
    investment_account: 'Investment Account',
    crypto_account: 'Crypto Account',
    real_estate: 'Real Estate',
    business_interest: 'Business Interest',
    personal_property: 'Personal Property',
    other: 'Other',
  },

  // Actions
  createWill: 'Create Will',
  updateWill: 'Update Will',
  deleteWill: 'Delete Will',
  activateWill: 'Activate Will',
  revokeWill: 'Revoke Will',
  viewWill: 'View Will',

  addBeneficiary: 'Add Beneficiary',
  updateBeneficiary: 'Update Beneficiary',
  removeBeneficiary: 'Remove Beneficiary',

  addExecutor: 'Add Executor',
  updateExecutor: 'Update Executor',
  removeExecutor: 'Remove Executor',

  validate: 'Validate',
  validateWill: 'Validate Will',

  // Form Fields
  willName: 'Will Name',
  willNamePlaceholder: 'e.g., Smith Family Will 2025',
  notes: 'Notes',
  notesPlaceholder: 'Additional notes or instructions',
  notesOptional: 'Notes (Optional)',

  legalDisclaimer: 'Legal Disclaimer',
  legalDisclaimerText:
    'I understand this is a digital will and I should consult with a legal advisor',
  acceptLegalDisclaimer: 'I accept the legal disclaimer',

  percentage: 'Percentage',
  percentageAllocation: 'Percentage Allocation',
  assetType: 'Asset Type',
  specificAsset: 'Specific Asset',
  specificAssetOptional: 'Specific Asset (Optional)',

  primaryExecutor: 'Primary Executor',
  executorOrder: 'Executor Order',
  isPrimary: 'Is Primary',

  conditions: 'Conditions',
  conditionsOptional: 'Conditions (Optional)',

  // Labels & Headers
  willDetails: 'Will Details',
  willManagement: 'Will Management',
  beneficiaryAllocation: 'Beneficiary Allocation',
  executorManagement: 'Executor Management',

  beneficiaryCount: 'Beneficiaries',
  executorCount: 'Executors',

  activatedAt: 'Activated',
  revokedAt: 'Revoked',
  executedAt: 'Executed',
  lastReviewed: 'Last Reviewed',

  // Messages & Alerts
  noWillsYet: 'No Wills Yet',
  noWillsDescription: 'Create your first will to begin estate planning for your household',

  cannotActivateWill: 'Cannot activate will',
  validationErrors: 'Validation Errors',

  mustHaveBeneficiaries: 'Must have at least one beneficiary',
  mustHaveExecutors: 'Must have at least one executor',
  mustAcceptDisclaimer: 'You must accept the legal disclaimer before activation',

  allocationMustBe100: 'Allocations must add up to 100% per asset type',
  allocationInvalid: 'Beneficiary allocations are invalid',

  willCreatedSuccess: 'Will created successfully',
  willUpdatedSuccess: 'Will updated successfully',
  willDeletedSuccess: 'Will deleted successfully',
  willActivatedSuccess: 'Will activated successfully',
  willRevokedSuccess: 'Will revoked successfully',

  beneficiaryAddedSuccess: 'Beneficiary added successfully',
  beneficiaryUpdatedSuccess: 'Beneficiary updated successfully',
  beneficiaryRemovedSuccess: 'Beneficiary removed successfully',

  executorAddedSuccess: 'Executor added successfully',
  executorUpdatedSuccess: 'Executor updated successfully',
  executorRemovedSuccess: 'Executor removed successfully',

  // Errors
  willNotFound: 'Will not found',
  noAccessToWill: 'You do not have access to this will',
  beneficiaryNotFound: 'Beneficiary not found',
  executorNotFound: 'Executor not found',

  cannotUpdateActiveWill: 'Cannot update an active will',
  cannotDeleteActiveWill: 'Cannot delete an active will. Revoke active wills instead.',
  cannotModifyExecutedWill: 'Cannot modify an executed will',

  beneficiaryMustBeHouseholdMember: 'Beneficiary must be a household member',
  executorMustBeHouseholdMember: 'Executor must be a household member',

  previousWillAutoRevoked: 'Previous active will was automatically revoked',

  // Descriptions
  createWillDescription:
    'Create a draft will for your household. You can add beneficiaries and executors before activating it.',
  activateWillDescription:
    'Activating this will makes it legally binding (subject to legal review)',
  revokeWillDescription: 'Revoking this will makes it invalid. This action cannot be undone.',

  draftWillsOnly: 'Only draft wills can be deleted',
  oneActiveWillPerHousehold: 'Only one active will per household',

  // Validation
  validationPassed: 'Validation passed',
  validationFailed: 'Validation failed',

  // Tooltips & Help
  whatIsDigitalWill: 'What is a digital will?',
  digitalWillExplanation:
    'A digital will is an estate planning tool that helps you organize asset distribution. Always consult with a legal advisor for legal validity.',

  beneficiaryAllocationHelp: 'Percentage allocations must add up to 100% for each asset type',
  executorOrderHelp:
    'The primary executor is responsible for executing the will. Secondary executors serve as backups.',

  // Page-level keys (used by estate-planning page component)
  page: {
    title: 'Estate Planning',
    description: 'Manage wills, beneficiaries, and inheritance planning',
    createWill: 'Create Will',
    createDraft: 'Create Draft',
    noWills: 'No Wills Yet',
    noWillsDescription: 'Create your first will to start estate planning for your household',
    willDetails: 'Will Details and Management',
    noBeneficiaries: 'No beneficiaries added yet',
    noExecutors: 'No executors assigned yet',
  },
  dialog: {
    createWill: {
      title: 'Create New Will',
      description:
        'Create a draft will for your household. You can add beneficiaries and executors before activating it.',
    },
  },
  fields: {
    willName: 'Will Name',
    willNamePlaceholder: 'e.g., Smith Family Will 2025',
    notesOptional: 'Notes (Optional)',
    notesPlaceholder: 'Additional notes or instructions',
    legalDisclaimer: 'I understand this is a digital will and should consult legal counsel',
    beneficiaries: 'Beneficiaries:',
    executors: 'Executors:',
    activated: 'Activated:',
    primary: 'Primary',
    order: 'Order:',
  },
  actions: {
    activate: 'Activate Will',
    revoke: 'Revoke Will',
    cancel: 'Cancel',
    close: 'Close',
  },
  validation: {
    cannotActivate: 'Cannot activate will:',
  },
  lifeBeat: {
    title: 'Life Beat',
    description: "Your financial safety net for life's uncertainties",
    protectionStatus: 'Protection Status',
    statusDescription: 'Life Beat monitors your activity and alerts trusted contacts if needed',
    lastActivity: 'Last Activity',
    daysAgo: '{{days}} days ago',
    alertThresholds: 'Alert Thresholds',
    trustedExecutors: 'Trusted Executors',
    pendingAlerts: 'Pending Alerts',
    pendingAlertsDescription:
      'You have {{count}} pending inactivity alert(s). Check in to reset your timer.',
    checkIn: "I'm Okay - Check In Now",
    disabled: {
      title: 'Life Beat is Disabled',
      description:
        'Enable Life Beat to ensure your designated executors can access your financial information if something happens to you.',
      enable: 'Enable Life Beat',
    },
    executors: {
      title: 'Designated Executors',
      description: 'Trusted individuals who can access your financial overview',
      add: 'Add Executor',
      empty: {
        title: 'No Executors Yet',
        description: 'Add trusted individuals who can access your financial information.',
      },
      verified: 'Verified',
      pending: 'Pending',
      accessGranted: 'Access Granted',
    },
    addDialog: {
      title: 'Add Executor',
      description: 'Add a trusted person who can access your financial information.',
      fullName: 'Full Name',
      namePlaceholder: 'John Doe',
      email: 'Email Address',
      emailPlaceholder: 'john@example.com',
      relationship: 'Relationship',
      relationships: {
        spouse: 'Spouse',
        child: 'Child',
        sibling: 'Sibling',
        parent: 'Parent',
        attorney: 'Attorney',
        financialAdvisor: 'Financial Advisor',
        other: 'Other',
      },
      cancel: 'Cancel',
      submit: 'Add Executor',
    },
    howItWorks: {
      title: 'How Life Beat Works',
      step1: {
        title: 'Activity Monitoring',
        description: "We track your logins and activity. If you're active, nothing happens.",
      },
      step2: {
        title: 'Escalating Alerts',
        description: 'After 30, 60, 90 days of inactivity, we send you check-in reminders.',
      },
      step3: {
        title: 'Executor Access',
        description: "If you don't respond, your executors can request read-only access.",
      },
    },
    enableDialog: {
      title: 'Enable Life Beat Protection',
      description: 'Configure your inactivity thresholds and accept the legal disclaimer.',
      thresholdLabel: 'Alert Thresholds (days of inactivity)',
      days: '{{days}} days',
      thresholdHint:
        "You'll receive reminders at each threshold. Executors are notified at the final threshold.",
      legalTitle: 'Important Legal Notice',
      legalDescription:
        'Life Beat provides read-only access to financial summaries. It does not grant transaction authority, account access, or legal power of attorney. This feature is designed for informational purposes only and should complement, not replace, proper estate planning with legal counsel.',
      legalCheckbox:
        'I understand that Life Beat provides read-only financial visibility and does not constitute legal power of attorney or account access authority. I agree to the Terms of Service for this feature.',
      cancel: 'Cancel',
      enable: 'Enable Life Beat',
    },
  },
} as const;
