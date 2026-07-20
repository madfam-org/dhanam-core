export const importTranslations = {
  hub: {
    title: 'Import your data',
    description: 'Bring budgets, transactions, and categories from other platforms.',
    backToSettings: 'Back to settings',
    disabled: 'Platform import is not enabled in this environment yet.',
    comingSoon: 'Coming soon',
  },
  lunchmoney: {
    title: 'Lunch Money',
    subtitle: 'Import via developer API token',
    tokenLabel: 'API token',
    tokenPlaceholder: 'Paste your Lunch Money API token',
    tokenHelp:
      'Generate one in Lunch Money → Settings → Developers. We encrypt it and delete it after import.',
    startDateLabel: 'History start date',
    startDateHelp: 'Transactions from this date forward will be imported (YYYY-MM-DD).',
    preview: 'Preview import',
    startImport: 'Start import',
    importing: 'Importing…',
    reconnectTitle: 'Reconnect your banks',
    reconnectBody:
      'Linked accounts import as snapshots. Connect Belvo or Plaid in Accounts to keep balances syncing.',
    reconnectCta: 'Go to Accounts',
    doneTitle: 'Import complete',
    doneBody:
      'Your Lunch Money data is in Dhanam. Review categories and reconnect banks when ready.',
    limitations: 'Known limitations',
    counts: {
      categories: 'Categories',
      tags: 'Tags',
      accounts: 'Accounts',
      transactions: 'Transactions',
      recurring: 'Recurring',
      plaid: 'Plaid-linked (snapshot)',
      splitParentsSkipped: 'Split parents skipped',
    },
    steps: {
      token: 'Connect',
      preview: 'Preview',
      progress: 'Import',
      finish: 'Finish',
    },
    errors: {
      preflight: 'Could not reach Lunch Money. Check your token and try again.',
      start: 'Could not start import. Try again or contact support.',
      failed: 'Import failed',
    },
    status: {
      pending: 'Queued',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    },
  },
  platforms: {
    ynab: 'YNAB',
    monarch: 'Monarch Money',
    rocket: 'Rocket Money',
    csv: 'CSV file',
  },
} as const;

export type ImportTranslations = typeof importTranslations;
