/**
 * English Accounts Translations
 * Financial accounts, connections, sync
 */
export const accounts = {
  // Main
  accounts: 'Accounts',
  account: 'Account',
  myAccounts: 'My accounts',
  addAccount: 'Add account',
  newAccount: 'New account',
  editAccount: 'Edit account',
  deleteAccount: 'Delete account',
  accountDetails: 'Account details',
  manualAccount: 'Manual account',
  connectedAccount: 'Connected account',

  // Types
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit card',
  investment: 'Investment',
  loan: 'Loan',
  mortgage: 'Mortgage',
  crypto: 'Crypto',
  cash: 'Cash',
  other: 'Other',

  // Providers
  providerLabel: 'Provider',
  manual: 'Manual',
  belvo: 'Belvo',
  plaid: 'Plaid',
  bitso: 'Bitso',
  connected: 'Connected',
  disconnected: 'Disconnected',

  // Fields
  accountName: 'Account name',
  accountTypeLabel: 'Account type',
  accountNumber: 'Account number',
  lastFourDigits: 'Last 4 digits',
  routingNumber: 'Routing number',
  institution: 'Institution',
  balance: 'Balance',
  availableBalance: 'Available balance',
  currentBalance: 'Current balance',
  creditLimit: 'Credit limit',
  currency: 'Currency',
  lastSynced: 'Last synced',
  status: 'Status',

  // Status
  active: 'Active',
  inactive: 'Inactive',
  syncing: 'Syncing',
  syncFailed: 'Sync failed',
  needsReauth: 'Needs reauth',
  closed: 'Closed',

  // Actions
  connectAccount: 'Connect account',
  reconnect: 'Reconnect',
  disconnect: 'Disconnect',
  refreshBalance: 'Refresh balance',
  syncNow: 'Sync now',
  updateBalance: 'Update balance',
  viewTransactions: 'View transactions',
  hideAccount: 'Hide account',
  showAccount: 'Show account',

  // Connection
  selectInstitution: 'Select institution',
  searchInstitutions: 'Search institutions',
  popularInstitutions: 'Popular institutions',
  allInstitutions: 'All institutions',
  enterCredentials: 'Enter your credentials',
  authorizingConnection: 'Authorizing connection',
  connectionSuccessful: 'Connection successful',
  connectionFailed: 'Connection failed',
  retryConnection: 'Retry connection',

  // Sync
  syncInProgress: 'Sync in progress',
  syncCompleted: 'Sync completed',
  lastSyncedAt: 'Last synced: {{time}}',
  neverSynced: 'Never synced',
  autoSync: 'Auto sync',
  enableAutoSync: 'Enable auto sync',
  syncFrequency: 'Sync frequency',
  syncEveryHour: 'Every hour',
  syncDaily: 'Daily',
  syncWeekly: 'Weekly',

  // Balance
  totalBalance: 'Total balance',
  netWorth: 'Net worth',
  assets: 'Assets',
  liabilities: 'Liabilities',
  positiveBalance: 'Positive balance',
  negativeBalance: 'Negative balance',
  balanceHistory: 'Balance history',

  // Messages
  noAccounts: 'You have no accounts',
  addFirstAccount: 'Add your first account',
  accountCreated: 'Account created',
  accountUpdated: 'Account updated',
  accountDeleted: 'Account deleted',
  accountConnected: 'Account connected',
  accountDisconnected: 'Account disconnected',
  balanceUpdated: 'Balance updated',

  // Warnings
  accountInactive: 'This account is inactive',
  syncRequired: 'Sync required',
  reauthRequired: 'Reauth required',
  providerIssue: 'Provider issue',
  staleData: 'Stale data',

  // Errors
  accountNotFound: 'Account not found',
  institutionNotFound: 'Institution not found',
  invalidAccountNumber: 'Invalid account number',
  connectionError: 'Connection error',
  authenticationFailed: 'Authentication failed',
  insufficientPermissions: 'Insufficient permissions',
  providerError: 'Provider error',
  accountNameRequired: 'Account name is required',
  accountTypeRequired: 'Account type is required',
  balanceRequired: 'Balance is required',
  currencyRequired: 'Currency is required',

  // Confirmation
  confirmDelete: 'Delete this account?',
  deleteWarning: 'This will also delete all associated transactions',
  confirmDisconnect: 'Disconnect this account?',
  disconnectWarning: 'You will need to reauthorize to reconnect',

  // Page-level keys
  page: {
    title: 'Accounts',
    description: 'Connect your bank accounts and manage your finances',
  },
  provider: {
    belvo: 'Belvo (Mexico)',
    plaid: 'Plaid (US)',
    bitso: 'Bitso (Crypto)',
    manual: 'Manual Entry',
  },
  button: {
    addAccount: 'Add Account',
    addManually: 'Add Manually',
    createAccount: 'Create Account',
  },
  action: {
    delete: 'Delete',
  },
  dialog: {
    addAccount: {
      title: 'Add Account',
      description: 'Connect your bank account or add one manually',
      connectProvider: 'Connect with Provider',
      or: 'Or',
    },
    createManual: {
      title: 'Create Manual Account',
      description: "Add an account that you'll update manually",
    },
  },
  form: {
    accountName: 'Account Name',
    accountNamePlaceholder: 'e.g., Chase Checking',
    accountType: 'Account Type',
    selectAccountType: 'Select account type',
    currency: 'Currency',
    selectCurrency: 'Select currency',
    currentBalance: 'Current Balance',
  },
  accountType: {
    checking: 'Checking',
    savings: 'Savings',
    credit: 'Credit Card',
    investment: 'Investment',
    crypto: 'Crypto',
    other: 'Other',
  },
  card: {
    lastUpdated: 'Last updated:',
  },
  empty: {
    title: 'No accounts yet',
    description: 'Connect your bank accounts to start tracking your finances',
    addFirst: 'Add Your First Account',
  },
  toast: {
    connectSuccess: 'Account connected successfully',
    connectFailed: 'Failed to connect account',
    createSuccess: 'Account created successfully',
    createFailed: 'Failed to create account',
    deleteSuccess: 'Account deleted successfully',
    deleteFailed: 'Failed to delete account',
  },

  // Provider connection dialogs
  providers: {
    // Belvo
    belvo: {
      title: 'Connect Mexican Bank Account',
      description:
        'Securely connect your Mexican bank account using Belvo. Your credentials are encrypted and used only to fetch your financial data.',
      securityTitle: 'Bank-Level Security',
      securityEncryption: '256-bit AES encryption for credentials',
      securityReadOnly: 'Read-only access to your accounts',
      securityRegulated: 'CNBV regulated financial data access',
      securityKms: 'Credentials encrypted with AWS KMS',
      supportedBanks: 'Supported Mexican Banks',
      moreInstitutions: 'And 40+ other Mexican financial institutions',
      usernameLabel: 'Username / Client ID',
      usernamePlaceholder: 'Your online banking username',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Your online banking password',
      readOnlyNotice:
        "We'll only access your account balances and transaction history. No transfers or payments can be made through this connection.",
      connecting: 'Connecting...',
      connectButton: 'Connect Bank Account',
      privacyConsent: "By connecting, you agree to Belvo's",
      linkedSuccess: 'Successfully linked {{count}} account from {{bank}}',
      linkedSuccess_plural: 'Successfully linked {{count}} accounts from {{bank}}',
      invalidCredentials: 'Invalid username or password',
      institutionError: 'Bank is temporarily unavailable',
      mfaRequired: 'Your bank requires a one-time token to finish connecting',
      mfaTitle: 'Two-factor verification',
      mfaDescription:
        'Your bank sent you a one-time token (SMS, app, or physical device). Enter it below to finish connecting your account.',
      tokenLabel: 'One-time token',
      tokenPlaceholder: 'Enter the token from your bank',
      verifying: 'Verifying...',
      verifyButton: 'Verify and connect',
      mfaFailed: 'Token verification failed. Please try connecting again.',
      mfaBack: 'Back',
      linkFailed: 'Failed to connect bank account',
    },
    // Plaid
    plaid: {
      title: 'Connect US Bank Account',
      description:
        'Securely connect your US bank account using Plaid. Your login credentials are encrypted and never stored on our servers.',
      securityTitle: 'Bank-Level Security',
      securityEncryption: '256-bit SSL encryption',
      securityReadOnly: 'Read-only access to your accounts',
      securityTrusted: 'Used by thousands of financial apps',
      securityNoPasswords: 'No passwords stored',
      supportedBanks: 'Supported Banks & Credit Unions',
      moreInstitutions: 'And 10,000+ other US financial institutions',
      initializing: 'Initializing...',
      connecting: 'Connecting...',
      connectButton: 'Connect Bank Account',
      privacyConsent: "By connecting, you agree to Plaid's",
      initFailed: 'Failed to initialize Plaid Link',
      linkedSuccess: 'Successfully linked {{count}} account',
      linkedSuccess_plural: 'Successfully linked {{count}} accounts',
      linkFailed: 'Failed to link account',
      exitError: 'Failed to connect bank account',
    },
    // Bitso
    bitso: {
      title: 'Connect Bitso Crypto Account',
      description:
        'Connect your Bitso account to automatically track your cryptocurrency portfolio',
      securityNotice: 'Your API credentials are encrypted and secure.',
      securityDetail:
        'We use bank-level encryption and never store your credentials in plain text.',
      howToGetCredentials: 'How to get your Bitso API credentials',
      step1Title: 'Log in to Bitso',
      step1Description: 'and log in to your account',
      step2Title: 'Navigate to API Settings',
      step2Description: 'Go to Settings → API → Create New API Key',
      step3Title: 'Set Permissions',
      step3Description: 'Enable View permission only (read-only access)',
      step4Title: 'Copy Your Credentials',
      step4Description: "Copy your API Key and Secret (you'll only see the secret once!)",
      permissionsWarning:
        'Only enable "View" permissions. Never give trading permissions to third-party applications.',
      supportedCryptos: 'Supported Cryptocurrencies',
      haveCredentials: 'I Have My API Credentials',
      cancel: 'Cancel',
      apiKeyLabel: 'API Key',
      apiKeyPlaceholder: 'Your Bitso API Key',
      apiSecretLabel: 'API Secret',
      apiSecretPlaceholder: 'Your Bitso API Secret',
      enableAutoSync: 'Enable automatic portfolio sync',
      encryptionNotice:
        'Your credentials will be encrypted with AES-256 encryption before being stored.',
      connecting: 'Connecting...',
      connectButton: 'Connect Bitso Account',
      back: 'Back',
      missingCredentials: 'Please provide both API Key and Secret',
      linkedSuccess: 'Successfully connected Bitso account with {{count}} crypto holding',
      linkedSuccess_plural: 'Successfully connected Bitso account with {{count}} crypto holdings',
      connectFailed: 'Failed to connect Bitso account',
    },
  },
} as const;
