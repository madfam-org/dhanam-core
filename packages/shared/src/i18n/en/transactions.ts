/**
 * English Transactions Translations
 * Transaction management, categorization, filters
 */
export const transactions = {
  // Main
  transactions: 'Transactions',
  transaction: 'Transaction',
  newTransaction: 'New transaction',
  addTransaction: 'Add transaction',
  editTransaction: 'Edit transaction',
  deleteTransaction: 'Delete transaction',
  transactionDetails: 'Transaction details',

  // Types
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',

  // Fields
  amount: 'Amount',
  date: 'Date',
  description: 'Description',
  merchant: 'Merchant',
  category: 'Category',
  account: 'Account',
  notes: 'Notes',
  metadata: 'Metadata',
  pending: 'Pending',
  cleared: 'Cleared',
  reconciled: 'Reconciled',

  // Filters
  filterTransactions: 'Filter transactions',
  allTransactions: 'All transactions',
  incomeOnly: 'Income only',
  expensesOnly: 'Expenses only',
  uncategorized: 'Uncategorized',
  dateRange: 'Date range',
  amountRange: 'Amount range',
  selectAccount: 'Select account',
  selectCategory: 'Select category',
  selectMerchant: 'Select merchant',

  // Filter UI (transaction-filters.tsx)
  filter: {
    searchPlaceholder: 'Search transactions...',
    category: 'Category',
    account: 'Account',
    allCategories: 'All categories',
    allAccounts: 'All accounts',
    allTime: 'All time',
    thisMonth: 'This month',
    lastMonth: 'Last month',
    last90: 'Last 90 days',
    all: 'All',
    income: 'Income',
    expenses: 'Expenses',
    clear: 'Clear',
  },

  // Sorting
  sortBy: 'Sort by',
  sortByDate: 'Date',
  sortByAmount: 'Amount',
  sortByMerchant: 'Merchant',
  sortByCategory: 'Category',
  newest: 'Newest',
  oldest: 'Oldest',
  highest: 'Highest amount',
  lowest: 'Lowest amount',

  // Categorization
  categorize: 'Categorize',
  bulkCategorize: 'Bulk categorize',
  autoCategorize: 'Auto categorize',
  categorizeSelected: 'Categorize selected',
  categoryRules: 'Category rules',
  createRule: 'Create rule',
  applyRules: 'Apply rules',
  rulesApplied: 'Rules applied',

  // Actions
  split: 'Split',
  merge: 'Merge',
  duplicate: 'Duplicate',
  markAsReconciled: 'Mark as reconciled',
  markAsPending: 'Mark as pending',
  attachReceipt: 'Attach receipt',
  viewReceipt: 'View receipt',

  // Bulk operations
  bulkEdit: 'Bulk edit',
  bulkDelete: 'Bulk delete',
  selectedTransactions: '{{count}} transactions selected',
  selectAll: 'Select all',
  deselectAll: 'Deselect all',

  // Messages
  noTransactions: 'No transactions',
  noTransactionsInRange: 'No transactions in this range',
  transactionCreated: 'Transaction created',
  transactionUpdated: 'Transaction updated',
  transactionDeleted: 'Transaction deleted',
  transactionsCategorized: '{{count}} transactions categorized',
  transactionsImported: '{{count}} transactions imported',

  // Import/Export
  importTransactions: 'Import transactions',
  exportTransactions: 'Export transactions',
  downloadCSV: 'Download CSV',
  downloadPDF: 'Download PDF',
  uploadFile: 'Upload file',
  selectFile: 'Select file',
  supportedFormats: 'Supported formats: CSV, OFX, QFX',

  // Search
  searchTransactions: 'Search transactions',
  searchByDescription: 'Search by description',
  searchByMerchant: 'Search by merchant',

  // Stats
  totalIncome: 'Total income',
  totalExpenses: 'Total expenses',
  netIncome: 'Net income',
  averageTransaction: 'Average transaction',
  transactionCount: 'Transaction count',
  largestExpense: 'Largest expense',
  largestIncome: 'Largest income',

  // Errors
  transactionNotFound: 'Transaction not found',
  invalidAmount: 'Invalid amount',
  invalidDate: 'Invalid date',
  accountRequired: 'Account is required',
  amountRequired: 'Amount is required',
  dateRequired: 'Date is required',
  descriptionRequired: 'Description is required',

  // Page-level keys
  page: {
    title: 'Transactions',
    description: 'View and manage all your transactions',
  },
  button: {
    addTransaction: 'Add Transaction',
    createTransaction: 'Create Transaction',
    updateTransaction: 'Update Transaction',
  },
  action: {
    edit: 'Edit',
    delete: 'Delete',
    categorize: 'Categorize',
  },
  dialog: {
    create: {
      title: 'Create Transaction',
      description: 'Add a new transaction to your account',
    },
    edit: {
      title: 'Edit Transaction',
      description: 'Update transaction details',
    },
  },
  form: {
    account: 'Account',
    selectAccount: 'Select account',
    amount: 'Amount',
    date: 'Date',
    description: 'Description',
    descriptionPlaceholder: 'e.g., Grocery shopping',
    merchantOptional: 'Merchant (Optional)',
    merchantPlaceholder: 'e.g., Walmart',
  },
  list: {
    title: 'Recent Transactions',
    found: 'transactions found',
    unknownAccount: 'Unknown',
  },
  empty: {
    title: 'No transactions yet',
    description: 'Start adding transactions to track your spending',
    addFirst: 'Add Your First Transaction',
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
  },
  toast: {
    createSuccess: 'Transaction created successfully',
    createFailed: 'Failed to create transaction',
    updateSuccess: 'Transaction updated successfully',
    updateFailed: 'Failed to update transaction',
    deleteSuccess: 'Transaction deleted successfully',
    deleteFailed: 'Failed to delete transaction',
  },
  recurring: {
    title: 'Recurring Transactions',
    description: 'Track and manage your subscriptions and regular payments',
    detectPatterns: 'Detect Patterns',
    monthlyTotal: 'Monthly Total',
    active: 'Active',
    confirmedRecurring: 'Confirmed recurring',
    detected: 'Detected',
    awaitingConfirmation: 'Awaiting confirmation',
    upcoming: 'Upcoming',
    thisMonth: 'This month',
    perYear: '{{amount}}/year',
    frequency: {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    },
    tabs: {
      active: 'Active ({{count}})',
      detected: 'Detected ({{count}})',
      paused: 'Paused ({{count}})',
    },
    emptyConfirmed: {
      title: 'No confirmed recurring transactions',
      description: 'Click "Detect Patterns" to find recurring transactions',
    },
    emptyDetected: {
      title: 'No patterns detected',
      description: 'Your transaction history will be analyzed for recurring patterns',
    },
    emptyPaused: {
      title: 'No paused patterns',
      description: 'Paused patterns will appear here',
    },
    dialog: {
      lastOccurrence: 'Last Occurrence',
      nextExpected: 'Next Expected',
      occurrences: 'Occurrences',
      confidence: 'Confidence',
      recentTransactions: 'Recent Transactions',
      close: 'Close',
    },
    card: {
      next: 'Next: {{date}}',
      viewDetails: 'View Details',
      resume: 'Resume',
      pause: 'Pause',
      delete: 'Delete',
      confirm: 'Confirm',
      occurrences: '{{count}} occurrences',
      confidence: '{{percent}}% confidence',
      detectedLabel: 'Detected: {{frequency}}',
    },
    toast: {
      detected: 'Detected {{count}} new recurring patterns',
      detectFailed: 'Failed to detect patterns',
      confirmed: 'Recurring pattern confirmed',
      confirmFailed: 'Failed to confirm pattern',
      dismissed: 'Pattern dismissed',
      dismissFailed: 'Failed to dismiss pattern',
      statusUpdated: 'Status updated',
      statusFailed: 'Failed to update status',
      deleted: 'Pattern deleted',
      deleteFailed: 'Failed to delete pattern',
    },
    na: 'N/A',
  },

  // Calendar view
  calendar: {
    title: 'Calendar',
    description: 'View your transactions day by day.',
    today: 'Today',
    dayDetails: 'Day Details',
    clickToSee: 'Click on a day to see its transactions.',
    noDetails: 'No transaction details available.',
    transactionCount: '{{count}} transaction',
    transactionCountPlural: '{{count}} transactions',
    income: 'Income',
    expenses: 'Expenses',
    net: 'Net',
    monthlySummary: 'Monthly Summary',
    noSpaceSelected: 'No space selected',
    selectSpacePrompt: 'Select a space to view the calendar.',
    categoryBreakdown: 'By Category',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    uncategorized: 'Uncategorized',
  },
} as const;
