export const audits: Record<string, string> = {
  // Header
  title: 'Ukaguzi wa Mfumo',
  immutableBadge: 'Kumbukumbu Zisizobadilika',
  backToPanel: 'Rudi kwenye Dashibodi',
  cloudActive: 'Wingu Imewashwa',
  localFile: 'Kumbukumbu ya Ndani',
  localShort: 'Ndani',
  cloudActiveTooltip: 'Hifadhi ya Wingu Inayofanya Kazi (Mpango wa Malipo)',
  localFileTooltip: 'Kumbukumbu ya Ndani katika SQLite (Bofya kuona maelezo ya mpango wa wingu)',
  exportCsv: 'Pakua CSV',
  exportCsvTooltip: 'Pakua kumbukumbu kwa CSV',
  refreshTooltip: 'Pyaisha Kumbukumbu',
  guideTooltip: 'Mwongozo wa Ukaguzi na Usalama',

  // Subscription Lock Modal
  cloudBackupTitle: 'Hifadhi na Usawazishaji wa Wingu',
  cloudBackupDesc: 'Hifadhi ya wingu na historia ya ukaguzi ya daima inapatikana kwenye mipango ya malipo. Katika hali ya bure, kumbukumbu zote huwekwa salama kwenye SQLite ya kifaa.',

  // Summary Cards
  cardTotalLogs: 'Jumla ya Kumbukumbu',
  infoTotalLogs: 'Taarifa kuhusu Kumbukumbu',
  unitActions: 'vitendo',
  noteSqliteAudited: 'SQLite Iliyokaguliwa',

  cardTodayLogs: 'Leo',
  infoTodayLogs: 'Taarifa kuhusu Matukio ya Leo',
  unitToday: 'leo',
  noteSessionsSales: 'Vipindi & Mauzo',

  cardOperators: 'Waendeshaji',
  infoOperators: 'Taarifa kuhusu Waendeshaji',
  unitUsers: 'watumiaji',
  noteIndividualTracking: 'Ufuatiliaji wa mtu binafsi',

  cardCriticalActions: 'Vitendo Muhimu',
  infoCriticalActions: 'Taarifa kuhusu Vitendo Muhimu',
  unitAlerts: 'tahadhari',
  noteReversalsPermissions: 'Urejesho / Ruhusa',

  cardCloudBackup: 'Hifadhi ya Wingu',
  cloudBackupActive: 'Wingu Imewashwa',
  cloudBackupLocal: 'Kumbukumbu ya Ndani',
  autoBackupLabel: 'Hifadhi ya Moja kwa Moja',
  freeModeLockedLabel: 'Hali ya Bure (Imefungwa)',

  cardIntegrity: 'Uthabiti',
  integrityValue: '100% Thabiti',
  noteSha256Verified: 'Imethibitishwa kwa SHA-256',

  // Toolbar
  catAll: 'Yote',
  catProducts: 'Bidhaa',
  catSales: 'Mauzo',
  catSessionLogin: 'Kipindi / Ingia',
  catOperatorsCashier: 'Waendeshaji & Droo',
  catRestock: 'Ujazo wa Bidhaa',

  dateAll: 'Tarehe zote',
  dateToday: 'Leo',
  dateWeek: 'Siku 7 zilizopita',
  dateMonth: 'Siku 30 zilizopita',

  showSummary: 'Onyesha Muhtasari',
  hideSummary: 'Ficha Muhtasari',
  showSummaryTooltip: 'Onyesha kadi za vipimo',
  hideSummaryTooltip: 'Ficha kadi za vipimo',

  searchPlaceholder: 'Tafuta kitendo, mwendeshaji, Kitambulisho...',

  // Table State
  loadingLogs: 'Inapakia kumbukumbu za ukaguzi...',
  noLogsFiltered: 'Hakuna kumbukumbu zilizopatikana kwa vichungi vilivyotumika',
  noLogsSystem: 'Hakuna kumbukumbu za ukaguzi katika mfumo',
  adjustSearchHint: 'Jaribu kuweka upya vichungi au kubadilisha maneno ya utafutaji.',

  // Table Headers
  thLogAction: 'Kumbukumbu / Kitendo',
  thOperator: 'Mwendeshaji',
  thCategory: 'Kategoria',
  thOperationDetails: 'Maelezo ya Operesheni',
  thDateTime: 'Tarehe & Muda',
  thCloudStatus: 'Hali ya Wingu',
  thActions: 'Vitendo',

  // Table Badges & Sync
  syncCloudTooltip: 'Imesawazishwa kwenye wingu / SQLite',
  syncPendingTooltip: 'Kumbukumbu ya ndani inasubiri hifadhi ya wingu',
  syncedCloudLabel: 'Imesawazishwa Wingu',
  storedSqliteLabel: 'Imehifadhiwa SQLite',
  systemOperator: 'Mfumo',
  viewDetailsTooltip: 'Angalia maelezo ya ukaguzi',

  // Table Pagination
  paginationShowing: 'Inaonyesha',
  paginationTo: 'hadi',
  paginationOf: 'kati ya',
  paginationRecords: 'kumbukumbu',
  paginationFilteredFrom: '(imechujwa kutoka {0})',
  prevBtn: 'Iliyotulia',
  nextBtn: 'Inayofuata',

  // Detail Modal
  modalDetailTitle: 'Maelezo ya Kumbukumbu ya Ukaguzi',
  modalIdLabel: 'Kitambulisho:',
  modalExecutedAction: 'Kitendo Kilichotekelezwa',
  modalSyncedCloud: 'Imesawazishwa Wingu',
  modalStoredSqlite: 'Imehifadhiwa SQLite',
  modalResponsibleOperator: 'Mwendeshaji Anayehusika',
  modalExactDateTime: 'Tarehe & Muda Kamili',
  modalFullDescription: 'Maelezo Kamili & Data za Ziada',
  modalSha256Signature: 'Saini ya Kriptografia SHA-256',
  modalCopyBtn: 'Nakili',
  modalCopiedToast: '{field} imenakiliwa',
  modalNoDetails: 'Hakuna maelezo yaliyorekodiwa.',
  modalCloseBtn: 'Funga',

  // Guide Modal
  guideTitle: 'Mwongozo wa Ukaguzi & Usalama',
  guideSubtitle: 'Ukweli, uthabiti usiobadilika na hifadhi ya wingu',
  guideWhatIsTitle: 'Moduli ya Ukaguzi ni Nini?',
  guideWhatIsDesc: 'Moduli ya ukaguzi inarekodi moja kwa moja operesheni zote muhimu za mfumo (mauzo, urejesho, utoaji wa pesa, mabadiliko ya waendeshaji, punguzo na ruhusa) kwa mfuatano usiolaghaiwa.',
  guideItem1Title: '1. Hifadhi ya Ndani ya SQLite (Offline-First)',
  guideItem1Desc: 'Matukio yote yanahifadhiwa mara moja kwenye hifadhi ya SQLite ya ndani, ikihakikisha kasi bila kuchelewa hata bila mtandao.',
  guideItem2Title: '2. Hifadhi na Kumbukumbu ya Wingu (Mpango wa Malipo)',
  guideItem2Desc: 'Moduli ya hifadhi ya wingu ikifanya kazi, kumbukumbu zinasawazishwa na Supabase kwa hifadhi ya daima. Katika hali ya bure, zinasalia salama kwenye kifaa cha ndani.',
  guideItem3Title: '3. Saini ya Kriptografia SHA-256',
  guideItem3Desc: 'Kila kiingilio kinazalisha saini ya kriptografia inayohusishwa na tukio lililotangulia, ikitengeneza mnyororo usiobadilika unaotambua jaribio lolote la kubadilisha data kwa mikono.',
  guideUnderstoodBtn: 'Nimeelewa'
};

export default audits;
