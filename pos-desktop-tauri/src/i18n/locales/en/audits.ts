export const audits: Record<string, string> = {
  // Header
  title: 'System Audit',
  immutableBadge: 'Immutable Logs',
  backToPanel: 'Back to Dashboard',
  cloudActive: 'Cloud Active',
  localFile: 'Local Archive',
  localShort: 'Local',
  cloudActiveTooltip: 'Continuous Cloud Backup Active (Paid Plan)',
  localFileTooltip: 'Local Archive in SQLite (Click to see cloud backup plan details)',
  exportCsv: 'Export CSV',
  exportCsvTooltip: 'Export records to CSV',
  refreshTooltip: 'Refresh Records',
  guideTooltip: 'Audit & Security Guide',

  // Subscription Lock Modal
  cloudBackupTitle: 'Cloud Backup & Sync',
  cloudBackupDesc: 'Cloud backup and perpetual audit trail history are available on paid plans. In free mode, all logs are kept securely and locally in the device SQLite database.',

  // Summary Cards
  cardTotalLogs: 'Total Records',
  infoTotalLogs: 'Information about Records',
  unitActions: 'actions',
  noteSqliteAudited: 'Audited SQLite Database',

  cardTodayLogs: 'Today',
  infoTodayLogs: 'Information about Today\'s Events',
  unitToday: 'today',
  noteSessionsSales: 'Sessions & Sales',

  cardOperators: 'Operators',
  infoOperators: 'Information about Operators',
  unitUsers: 'users',
  noteIndividualTracking: 'Individual tracking',

  cardCriticalActions: 'Critical Actions',
  infoCriticalActions: 'Information about Critical Actions',
  unitAlerts: 'alerts',
  noteReversalsPermissions: 'Reversals / Permissions',

  cardCloudBackup: 'Cloud Backup',
  cloudBackupActive: 'Cloud Active',
  cloudBackupLocal: 'Local Archive',
  autoBackupLabel: 'Automated Backup',
  freeModeLockedLabel: 'Free Mode (Locked)',

  cardIntegrity: 'Integrity',
  integrityValue: '100% Intact',
  noteSha256Verified: 'SHA-256 Verified',

  // Toolbar
  catAll: 'All',
  catProducts: 'Products',
  catSales: 'Sales',
  catSessionLogin: 'Session / Login',
  catOperatorsCashier: 'Operators & Till',
  catRestock: 'Restock',

  dateAll: 'All dates',
  dateToday: 'Today',
  dateWeek: 'Last 7 days',
  dateMonth: 'Last 30 days',

  showSummary: 'Show Summary',
  hideSummary: 'Hide Summary',
  showSummaryTooltip: 'Show metric cards',
  hideSummaryTooltip: 'Hide metric cards',

  searchPlaceholder: 'Search action, operator, ID...',

  // Table State
  loadingLogs: 'Loading audit logs...',
  noLogsFiltered: 'No records found matching applied filters',
  noLogsSystem: 'No audit records in system',
  adjustSearchHint: 'Try resetting filters or modifying your search terms.',

  // Table Headers
  thLogAction: 'Record / Action',
  thOperator: 'Operator',
  thCategory: 'Category',
  thOperationDetails: 'Operation Details',
  thDateTime: 'Date & Time',
  thCloudStatus: 'Cloud Status',
  thActions: 'Actions',

  // Table Badges & Sync
  syncCloudTooltip: 'Synced to cloud / SQLite',
  syncPendingTooltip: 'Local record pending cloud backup',
  syncedCloudLabel: 'Synced to Cloud',
  storedSqliteLabel: 'Stored in SQLite',
  systemOperator: 'System',
  viewDetailsTooltip: 'View audit record details',

  // Table Pagination
  paginationShowing: 'Showing',
  paginationTo: 'to',
  paginationOf: 'of',
  paginationRecords: 'records',
  paginationFilteredFrom: '(filtered from {0})',
  prevBtn: 'Previous',
  nextBtn: 'Next',

  // Detail Modal
  modalDetailTitle: 'Audit Record Details',
  modalIdLabel: 'ID:',
  modalExecutedAction: 'Executed Action',
  modalSyncedCloud: 'Synced to Cloud',
  modalStoredSqlite: 'Stored in SQLite',
  modalResponsibleOperator: 'Responsible Operator',
  modalExactDateTime: 'Exact Date & Time',
  modalFullDescription: 'Full Description & Metadata',
  modalSha256Signature: 'SHA-256 Cryptographic Signature',
  modalCopyBtn: 'Copy',
  modalCopiedToast: '{field} copied to clipboard',
  modalNoDetails: 'No recorded details.',
  modalCloseBtn: 'Close',

  // Guide Modal
  guideTitle: 'Audit & Security Guide',
  guideSubtitle: 'Transparency, immutable integrity, and cloud backup',
  guideWhatIsTitle: 'What is the Audit Module?',
  guideWhatIsDesc: 'The audit module automatically logs all critical system operations (sales, reversals, till drops, operator changes, discounts, and permissions) in a chronological, tamper-proof audit trail.',
  guideItem1Title: '1. Offline-First SQLite Recording',
  guideItem1Desc: 'All events are written instantly to the local SQLite database, guaranteeing zero sales latency even without internet.',
  guideItem2Title: '2. Cloud Backup & Archiving (Paid Plan)',
  guideItem2Desc: 'With the Cloud Archive module active, logs synchronize to Supabase for perpetual storage and remote reporting. In free mode, logs remain safe on the local device.',
  guideItem3Title: '3. SHA-256 Cryptographic Signature',
  guideItem3Desc: 'Each entry generates a cryptographic signature linked to the previous event, establishing an immutable chain that detects manual database tampering.',
  guideUnderstoodBtn: 'Understood'
};

export default audits;
