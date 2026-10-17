export const enScanHistory: Record<string, string> = {
  // Topbar / Header
  backTooltip: 'Back',
  headerTitle: 'Activity & Scans Log',
  headerTitleWithUser: 'Scan History: {name}',
  proPlanBadge: 'Pro Plan',
  scansRecorded: '{count} scans recorded',
  operatorsCount: '{count} operators',
  operatorsSingular: '{count} operator',
  globalRevenue: 'Global Revenue:',
  guideTooltip: 'Admin Explanatory Guide',
  loading: 'Loading scans audit...',

  // Subscription Locked Feature
  lockExclusive: 'Exclusive Pro & Enterprise Feature',
  lockTitle: 'Forensic Scan Audit (Anti-Theft)',
  lockDesc: 'Chronological access to every barcode scanned by cashier, checkout times, and drawer reconciliation is part of the Pro plan.',
  lockFeature1Title: 'Record of Every Scan',
  lockFeature1Desc: 'Exact timestamp and product registered on scanner.',
  lockFeature2Title: 'Ranking by Operator',
  lockFeature2Desc: 'Comparative billing and volume metrics.',
  lockFeature3Title: 'Payout Tracking',
  lockFeature3Desc: 'Audit of cash drops and drawer withdrawals.',
  lockFeature4Title: 'Anti-Fraud Prevention',
  lockFeature4Desc: 'Prevent stock loss and unrecorded sales.',
  btnBackToPanel: 'Back to Panel',
  btnUnlockPro: 'Unlock with Pro / Enterprise',

  // Operator Table Toolbar
  searchOperatorPlaceholder: 'Search by operator or ID...',
  sortBy: 'Sort by:',
  sortSalesDesc: 'Highest Revenue',
  sortScansDesc: 'Most Scans',
  sortNameAsc: 'Name (A-Z)',
  operatorBadgeSingular: 'Operator',
  operatorBadgePlural: 'Operators',
  totalBips: 'Total Scans:',

  // Operator Table Content
  noOperatorsFound: 'No operators found',
  adjustSearch: 'Try adjusting your search.',
  thOperatorPerf: 'Operator / Performance',
  thScansItems: 'Scans / Items',
  thValuesByMethod: 'Values by Method (MT)',
  thPayouts: 'Payouts',
  thTotalRevenue: 'Total Revenue',
  syncedCloud: 'Synced with Cloud',
  syncPending: 'Pending synchronization',
  topSeller: 'Top',
  bipsCount: '{count} scans',
  itemsCount: '{count} items',
  singleItem: '{count} item',
  payoutsCountSingular: '{count} payout',
  payoutsCountPlural: '{count} payouts',

  // Operator Details Toolbar & Subtabs
  tabSalesScans: 'Sales / Scans ({count})',
  tabPayouts: 'Payouts ({count})',
  searchScansPlaceholder: 'Search product or barcode scan...',
  searchPayoutsPlaceholder: 'Search reason or note...',
  filterAll: 'All',
  filterCash: 'CASH',
  filterMpesa: 'MPS',
  filterEmola: 'EML',
  filterFiado: 'CREDIT',
  subtotal: 'Subtotal:',
  sortNewest: 'Newest First',
  sortOldest: 'Oldest First',

  // Operator Details Scans Table
  noScansFound: 'No scan records found',
  noScansDesc: 'Try adjusting your search or payment filters.',
  thItemBarcode: 'Item / Barcode Scan',
  thQuantity: 'Quantity',
  thPaymentMethod: 'Payment Method',
  thTotalValue: 'Total Value (MT)',
  thTime: 'Time',
  unregisteredProduct: 'Unregistered Product',
  todayAt: 'Today, {time}',

  // Operator Details Payouts Table
  noPayoutsFound: 'No drawer payouts',
  noPayoutsDesc: 'This operator has not made any cash withdrawals yet.',
  thReasonCategory: 'Reason / Category',
  thNotes: 'Notes',
  thWithdrawnAmount: 'Withdrawn Amount',
  thDateTime: 'Date / Time',
  noNotes: 'No notes',

  // Payment Badges
  badgeCash: 'Cash',
  badgeMpesa: 'M-Pesa',
  badgeEmola: 'e-Mola',
  badgeFiado: 'Credit',

  // Pagination
  paginationShowing: 'Showing',
  paginationTo: 'to',
  paginationOf: 'of',
  paginationOperators: 'operators',
  paginationRecords: 'records',
  prevBtn: 'Previous',
  nextBtn: 'Next',

  // Guide Modal
  guideModalTitle: 'Scan History & Sales Guide',
  guidePageOf: 'Page {current} of {total}',
  guideModalSubtitle: 'Barcode tracking, payment flow, and cash register audit',
  guideCloseBtn: 'Close',

  // Page 1
  page1SectionTitle: '1. Scan Telemetry & Sales',
  page1SectionDesc: 'Every item passed through the barcode scanner or typed manually is audited with second-by-second accuracy.',
  page1Card1Badge: 'Auto Scan',
  page1Card1Title: 'USB Optical Scanner',
  page1Card1Desc: 'Identifies products instantly. Records the exact barcode scanned, scan timestamp, and quantity added to cart.',
  page1Card2Badge: 'Sales & Transactions',
  page1Card2Title: 'Receipt Association',
  page1Card2Desc: 'Associates each scan with the responsible cashier and the finalized sale in the POS terminal.',
  page1Card3Badge: 'Scan Filter',
  page1Card3Title: 'Success vs Failure',
  page1Card3Desc: 'Helps detect unregistered barcodes or rejected scan attempts for catalog auditing.',

  // Page 2
  page2SectionTitle: '2. Physical Cash Balance & Payment Methods',
  page2SectionDesc: 'The system strictly separates actual cash received (drawer) from electronic and credit transactions.',
  page2Card1Badge: 'Physical Balance (Drawer)',
  page2Card1Title: 'Cash DIN - Payouts',
  page2Card1Desc: 'Formula: Cash - Payouts. This is the exact monetary amount that must be physically present in the drawer.',
  page2Card2Badge: 'M-Pesa & E-Mola',
  page2Card2Title: 'Mobile Wallets',
  page2Card2Desc: 'Mobile payments credit the store\'s digital account and do not affect physical cash reconciliation.',
  page2Card3Badge: 'Credit Sales / Accounts',
  page2Card3Title: 'Customer Credit',
  page2Card3Desc: 'Accounted for in sales statistics, but segregated from immediate cash liquidation.',

  // Page 3
  page3SectionTitle: '3. Cash Drops (Payouts) & Offline SQLite',
  page3SectionDesc: 'Complete transparency in operational expenses and 100% offline storage guaranteed in local SQLite.',
  page3Card1Badge: 'Cash Drops',
  page3Card1Title: 'Payouts & Expenses',
  page3Card1Desc: 'Record of cash withdrawals with reasons (suppliers, change, petty cash), directly deducted from cash balance.',
  page3Card2Badge: 'SQLite Offline-First',
  page3Card2Title: 'Total Resilience',
  page3Card2Desc: 'All scans and transactions are written instantaneously to the local database. No scans are lost without internet.',
  page3Card3Badge: 'Cloud Sync',
  page3Card3Title: 'Background Backup',
  page3Card3Desc: 'Once connectivity stabilizes, the sync engine dispatches batches to Supabase without freezing the POS.',

  // Guide Footer
  dontShowAgain: 'Do not show again',
  prevSlide: 'Previous',
  nextSlide: 'Next',
  understoodClose: 'Understood'
};

export default enScanHistory;
