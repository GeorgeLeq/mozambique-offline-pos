export const audits: Record<string, string> = {
  // Header
  title: 'Audit du Système',
  immutableBadge: 'Journaux Immuables',
  backToPanel: 'Retour au Panneau',
  cloudActive: 'Cloud Actif',
  localFile: 'Archive Locale',
  localShort: 'Local',
  cloudActiveTooltip: 'Sauvegarde Cloud Continue Active (Plan Payant)',
  localFileTooltip: 'Archive Locale dans SQLite (Cliquez pour voir les détails du plan cloud)',
  exportCsv: 'Exporter CSV',
  exportCsvTooltip: 'Exporter les enregistrements en CSV',
  refreshTooltip: 'Actualiser les Enregistrements',
  guideTooltip: 'Guide d\'Audit et Sécurité',

  // Subscription Lock Modal
  cloudBackupTitle: 'Sauvegarde et Synchronisation Cloud',
  cloudBackupDesc: 'La sauvegarde cloud et l\'historique d\'audit perpétuel sont disponibles dans les plans payants. En mode gratuit, les enregistrements sont conservés localement et en toute sécurité dans SQLite.',

  // Summary Cards
  cardTotalLogs: 'Total Enregistrements',
  infoTotalLogs: 'Informations sur les Enregistrements',
  unitActions: 'actions',
  noteSqliteAudited: 'Base SQLite auditée',

  cardTodayLogs: 'Aujourd\'hui',
  infoTodayLogs: 'Informations sur les Événements du Jour',
  unitToday: 'aujourd\'hui',
  noteSessionsSales: 'Sessions & Ventes',

  cardOperators: 'Opérateurs',
  infoOperators: 'Informations sur les Opérateurs',
  unitUsers: 'utilisateurs',
  noteIndividualTracking: 'Suivi individuel',

  cardCriticalActions: 'Actions Critiques',
  infoCriticalActions: 'Informations sur les Actions Critiques',
  unitAlerts: 'alertes',
  noteReversalsPermissions: 'Annulations / Permissions',

  cardCloudBackup: 'Sauvegarde Cloud',
  cloudBackupActive: 'Cloud Actif',
  cloudBackupLocal: 'Archive Locale',
  autoBackupLabel: 'Sauvegarde Automatique',
  freeModeLockedLabel: 'Mode Gratuit (Verrouillé)',

  cardIntegrity: 'Intégrité',
  integrityValue: '100% Intact',
  noteSha256Verified: 'SHA-256 Vérifié',

  // Toolbar
  catAll: 'Tous',
  catProducts: 'Produits',
  catSales: 'Ventes',
  catSessionLogin: 'Session / Connexion',
  catOperatorsCashier: 'Opérateurs & Caisse',
  catRestock: 'Réapprovisionnement',

  dateAll: 'Toutes les dates',
  dateToday: 'Aujourd\'hui',
  dateWeek: '7 derniers jours',
  dateMonth: '30 derniers jours',

  showSummary: 'Afficher le Résumé',
  hideSummary: 'Masquer le Résumé',
  showSummaryTooltip: 'Afficher les cartes de métriques',
  hideSummaryTooltip: 'Masquer les cartes de métriques',

  searchPlaceholder: 'Rechercher action, opérateur, ID...',

  // Table State
  loadingLogs: 'Chargement des journaux d\'audit...',
  noLogsFiltered: 'Aucun enregistrement trouvé avec les filtres appliqués',
  noLogsSystem: 'Aucun enregistrement d\'audit dans le système',
  adjustSearchHint: 'Essayez de réinitialiser les filtres ou de modifier vos termes de recherche.',

  // Table Headers
  thLogAction: 'Enregistrement / Action',
  thOperator: 'Opérateur',
  thCategory: 'Catégorie',
  thOperationDetails: 'Détails de l\'Opération',
  thDateTime: 'Date & Heure',
  thCloudStatus: 'Statut Cloud',
  thActions: 'Actions',

  // Table Badges & Sync
  syncCloudTooltip: 'Synchronisé dans le cloud / SQLite',
  syncPendingTooltip: 'Enregistrement local en attente de sauvegarde cloud',
  syncedCloudLabel: 'Synchronisé sur le Cloud',
  storedSqliteLabel: 'Stocké dans SQLite',
  systemOperator: 'Système',
  viewDetailsTooltip: 'Voir les détails de l\'enregistrement d\'audit',

  // Table Pagination
  paginationShowing: 'Affichage de',
  paginationTo: 'à',
  paginationOf: 'sur',
  paginationRecords: 'enregistrements',
  paginationFilteredFrom: '(filtré de {0})',
  prevBtn: 'Précédent',
  nextBtn: 'Suivant',

  // Detail Modal
  modalDetailTitle: 'Détails de l\'Enregistrement d\'Audit',
  modalIdLabel: 'ID :',
  modalExecutedAction: 'Action Exécutée',
  modalSyncedCloud: 'Synchronisé sur le Cloud',
  modalStoredSqlite: 'Stocké dans SQLite',
  modalResponsibleOperator: 'Opérateur Responsable',
  modalExactDateTime: 'Date & Heure Exactes',
  modalFullDescription: 'Description Complète & Métadonnées',
  modalSha256Signature: 'Signature Cryptographique SHA-256',
  modalCopyBtn: 'Copier',
  modalCopiedToast: '{field} copié dans le presse-papier',
  modalNoDetails: 'Aucun détail enregistré.',
  modalCloseBtn: 'Fermer',

  // Guide Modal
  guideTitle: 'Guide d\'Audit et Sécurité',
  guideSubtitle: 'Transparence, intégrité immuable et sauvegarde cloud',
  guideWhatIsTitle: 'Qu\'est-ce que le Module d\'Audit ?',
  guideWhatIsDesc: 'Le module d\'audit enregistre automatiquement toutes les opérations critiques du système (ventes, annulations, retraits de caisse, modifications d\'opérateurs, remises et autorisations) de manière chronologique et infalsifiable.',
  guideItem1Title: '1. Enregistrement Offline-First dans SQLite',
  guideItem1Desc: 'Tous les événements sont enregistrés instantanément dans la base de données SQLite locale, garantissant zéro latence de vente même sans connexion internet.',
  guideItem2Title: '2. Sauvegarde & Archivage Cloud (Plan Payant)',
  guideItem2Desc: 'Avec le module d\'Archive Cloud activé, les enregistrements sont synchronisés avec Supabase pour un stockage perpétuel. En mode gratuit, ils restent sécurisés sur l\'appareil local.',
  guideItem3Title: '3. Signature Cryptographique SHA-256',
  guideItem3Desc: 'Chaque entrée génère une signature cryptographique liée à l\'événement précédent, formant une chaîne immuable qui détecte toute tentative de modification manuelle.',
  guideUnderstoodBtn: 'Compris'
};

export default audits;
