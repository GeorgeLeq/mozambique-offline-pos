import { enShiftReports } from '../en/shiftReports';

// Fallback to English for French
export const frShiftReports: Record<string, string> = {
  ...enShiftReports,
  headerTitle: 'Rapports de Quart',
  backToMenu: 'Retour au Menu',
  recentShifts: 'Récents (30j)',
  archiveShifts: 'Archive',
  loadingArchive: 'Chargement...',
  showSummary: 'Afficher le Résumé',
  hideSummary: 'Masquer le Résumé',
  filterAll: 'Tous',
  filterOk: 'Sans Écart',
  filterShortage: 'Avec Écart Négatif',
  filterSurplus: 'Avec Excédent',
  thStatus: 'Statut',
  thShiftDate: 'Quart & Date',
  thOperator: 'Opérateur',
  thExpected: 'Attendu',
  thReported: 'Compté',
  thDifference: 'Différence',
  thDetails: 'Détails',
  printPdf: 'Imprimer PDF',
  prevBtn: 'Précédent',
  nextBtn: 'Suivant',
  understoodClose: 'Compris'
};

export default frShiftReports;
