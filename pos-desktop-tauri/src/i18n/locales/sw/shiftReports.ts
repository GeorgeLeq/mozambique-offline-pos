import { enShiftReports } from '../en/shiftReports';

// Fallback to English for Swahili
export const swShiftReports: Record<string, string> = {
  ...enShiftReports,
  headerTitle: 'Ripoti za Zamu',
  backToMenu: 'Rudi kwenye Menyu',
  recentShifts: 'Hivi karibuni (Siku 30)',
  archiveShifts: 'Kumbukumbu',
  loadingArchive: 'Inapakia...',
  showSummary: 'Onyesha Muhtasari',
  hideSummary: 'Ficha Muhtasari',
  filterAll: 'Zote',
  filterOk: 'Bila Upungufu',
  filterShortage: 'Yenye Upungufu',
  filterSurplus: 'Yenye Ziada',
  thStatus: 'Hali',
  thShiftDate: 'Zamu na Tarehe',
  thOperator: 'Opereta',
  thExpected: 'Inayotarajiwa',
  thReported: 'Iliyohesabiwa',
  thDifference: 'Tofauti',
  thDetails: 'Maelezo',
  printPdf: 'Chapisha PDF',
  prevBtn: 'Iliyotangulia',
  nextBtn: 'Inayofuata',
  understoodClose: 'Imeeleweka'
};

export default swShiftReports;
