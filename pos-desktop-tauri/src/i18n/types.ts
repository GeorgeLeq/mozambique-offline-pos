export type LanguageCode = 'pt' | 'en' | 'fr' | 'sw';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'pt', name: 'Português', nativeName: 'Português (MZ)', flag: '🇲🇿' },
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' }
];

export interface CommonTranslations {
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  back: string;
  close: string;
  search: string;
  filter: string;
  loading: string;
  actions: string;
  yes: string;
  no: string;
  ok: string;
  backToMenu: string;
  refresh: string;
  download: string;
  upload: string;
  export: string;
  import: string;
  all: string;
  status: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  synced: string;
  syncing: string;
  offline: string;
  online: string;
  managerModeActive: string;
  unlockedSession: string;
  enterAdminPin: string;
  pinRequiredMsg: string;
  invalidPin: string;
  lockSession: string;
  unlockSession: string;
  selectLanguage: string;
  add: string;
}

export interface ProductTranslations {
  // Tabs & Titles
  stockCheckerTab: string;
  productListTab: string;
  ordersTab: string;
  catalogTitle: string;
  stockCheckerTitle: string;
  ordersTitle: string;
  
  // Toolbar
  searchPlaceholder: string;
  allCategories: string;
  categories: string;
  totalProducts: string;
  sortBy: string;
  sortName: string;
  sortStockDesc: string;
  sortStockAsc: string;
  sortPriceDesc: string;
  sortPriceAsc: string;
  refresh: string;
  lowStockOnly: string;
  lockedOnly: string;
  focusMode: string;
  guide: string;

  // Table Headers
  tableProductName: string;
  tableCategory: string;
  tablePrice: string;
  tableSellUnit: string;
  tableCostMargin: string;
  tableStock: string;
  tableActions: string;
  syncPending: string;
  syncCloud: string;

  // Status & Badges
  inStock: string;
  lowStock: string;
  outOfStock: string;
  unclassified: string;
  noCategory: string;
  margin: string;
  retail: string;
  wholesale: string;
  cost: string;
  minStock: string;
  fractionalTag: string;

  // Actions & Buttons
  newProduct: string;
  editProduct: string;
  deleteProduct: string;
  quickStock: string;
  adjustStock: string;
  printBarcode: string;
  movementHistory: string;
  productDetails: string;
  exportPDF: string;
  exportCSV: string;
  importCSV: string;
  downloadTemplate: string;
  generateBarcode: string;
  barcodeGenerated: string;
  bulkActions: string;
  bulkSelected: string;
  unselectAll: string;
  bulkEdit: string;
  bulkLabels: string;
  bulkExportPDF: string;
  bulkDelete: string;

  // Pagination & Display
  showingPage: string;
  of: string;
  products: string;
  previous: string;
  next: string;
  noProductsFound: string;
  noProductsFoundSub: string;
  loadingProducts: string;

  // Form & Modals
  formTitleNew: string;
  formTitleEdit: string;
  basicInfo: string;
  name: string;
  namePlaceholder: string;
  barcode: string;
  barcodePlaceholder: string;
  generate: string;
  sku: string;
  skuPlaceholder: string;
  category: string;
  selectCategory: string;
  unit: string;
  pricing: string;
  retailPrice: string;
  costPrice: string;
  wholesalePrice: string;
  estimatedMargin: string;
  stockControl: string;
  initialStock: string;
  minStockAlert: string;
  supplier: string;
  supplierPlaceholder: string;
  location: string;
  locationPlaceholder: string;
  allowNegativeStock: string;
  saveProduct: string;
  updateProduct: string;
  saving: string;
  units: {
    unit: string;
    kg: string;
    g: string;
    l: string;
    ml: string;
    box: string;
    pack: string;
    sack: string;
  };

  // Product Types & Form Tabs
  productTypeUnit: string;
  productTypePack: string;
  productTypeFractional: string;
  productConfigTab: string;
  promoTab: string;
  applyPromo: string;
  promoPrice: string;
  packUnitsCount: string;
  parentProduct: string;
  autoDeductParent: string;

  // Product Details Modal
  detailsTitle: string;
  noBarcode: string;
  multiPackBadge: string;
  fractionalBadge: string;
  posLockedBadge: string;
  promoActiveBadge: string;
  packagingDetails: string;
  smartDeduction: string;
  linkedToStockOf: string;
  perSale: string;
  availableStock: string;
  profitabilityAndCost: string;
  unlockCost: string;
  costPriceLabel: string;
  grossProfit: string;
  markup: string;
  totalCostValue: string;
  totalSaleValue: string;
  projectedProfit: string;
  adminCostRestricted: string;
  productId: string;
  closeDetails: string;

  // Bulk Edit Modal
  bulkEditTitle: string;
  bulkEditingCount: string;
  bulkEditHint: string;
  keepCurrentCategory: string;
  typeToCreateCategory: string;
  setAs: string;
  unchanged: string;
  atLeastOneFieldRequired: string;
  bulkUpdatedSuccess: string;
  bulkUpdateError: string;
  saveChanges: string;

  // Label Printing Modal
  printStudioTitle: string;
  printStudioSubtitle: string;
  printLabelStudioTitle: string;
  printLabelSubtitle: string;
  printSelectedProducts: string;
  labelsQuantity: string;
  colsCount: string;
  standardLabel: string;
  labelQuantity: string;
  gridColumns: string;
  barcodeStandard: string;
  nameSize: string;
  visibleElements: string;
  priceTag: string;
  printLabelsBtn: string;
  a4Preview: string;
  productName: string;
  printLabelAction: string;
  a4SheetPreview: string;

  // Aliases Modal
  aliasesTitle: string;
  aliasesSubtitle: string;
  mainBarcode: string;
  scanOrTypeBarcode: string;
  addBarcode: string;
  altBarcodesCount: string;
  noAltBarcodes: string;
  aliasAddedSuccess: string;
  aliasRemovedSuccess: string;
  aliasIsMainError: string;
  aliasAlreadyUsedError: string;
  multiBarcodeTitle: string;
  multiBarcodeSubtitle: string;
  mainBarcodeLabel: string;
  alternativeBarcodes: string;
  noAlternativeBarcodes: string;
  barcodeAddedSuccess: string;
  barcodeRemovedSuccess: string;
  isMainBarcodeError: string;
  barcodeAlreadyMainError: string;
  barcodeAlreadyAliasError: string;
  errorLoadingAliases: string;
  errorAddingBarcode: string;
  errorRemovingBarcode: string;

  // Breakdown Modal
  breakdownTitle: string;
  breakdownSubtitle: string;
  breakdownDescription: string;
  currentBulkStock: string;
  targetProduct: string;
  selectTargetProduct: string;
  unitsGeneratedPerItem: string;
  unitsGeneratedPerBulk: string;
  breakdownSuccess: string;
  breakdownError: string;
  breakdownMinStockError: string;
  breakdownAction: string;
  invalidRatio: string;
  notEnoughStockBreakdown: string;
  breakdownFailed: string;

  // Admin PIN Modal
  adminAuthTitle: string;
  adminAuthSubtitle: string;
  clearKey: string;
  clearAll: string;
  deleteKey: string;
  confirmAuth: string;

  // Product Guide Modal
  guideTitle: string;
  guideSubtitle: string;
  guidePage: string;
  dontShowAgain: string;
  guideModalTitle: string;
  guidePageXofY: string;
  guideClose: string;
  guideDontShowAgain: string;
  guidePrev: string;
  guideNext: string;
  guideUnderstood: string;
  guideSec1Title: string;
  guideSec1Desc: string;
  guideStockCheckerTitle: string;
  guideStockCheckerSubtitle: string;
  guideStockCheckerDesc: string;
  guideProfitMarginTitle: string;
  guideProfitMarginSubtitle: string;
  guideProfitMarginDesc: string;
  guideMinStockTitle: string;
  guideMinStockSubtitle: string;
  guideMinStockDesc: string;
  guideSec2Title: string;
  guideSec2Desc: string;
  guideQuickStockTitle: string;
  guideQuickStockDesc: string;
  guideAliasesTitle: string;
  guideAliasesDesc: string;
  guideThermalLabelsTitle: string;
  guideThermalLabelsDesc: string;
  guideSec3Title: string;
  guideSec3Desc: string;
  guideSimpleUnitTitle: string;
  guideSimpleUnitDesc: string;
  guidePackBoxTitle: string;
  guidePackBoxDesc: string;
  guideBulkMeasureTitle: string;
  guideBulkMeasureDesc: string;

  // ProductForm & Sub-sections
  editRecord: string;
  newRecord: string;
  editProductTitle: string;
  addNewProductTitle: string;
  productFormSubtitle: string;
  productGuideBtn: string;
  productGuideBtnTitle: string;
  restoreSidePanel: string;
  expandFullScreen: string;
  packagingAndCalculation: string;
  bulkAndMetrics: string;
  promotionsAndDiscounts: string;
  attributesAndVariations: string;
  promotionsAndAttributes: string;
  attributesHelpText: string;
  pressEnterToSave: string;
  savingProduct: string;
  saveRecord: string;
  simpleUnit: string;
  simpleUnitDesc: string;
  packBoxBundle: string;
  packBoxBundleDesc: string;
  bulkSale: string;
  bulkSaleDesc: string;
  barcodeLabel: string;
  autoGenerate: string;
  scanOrGeneratePlaceholder: string;
  productNameLabel: string;
  productNamePlaceholder: string;
  categoryLabel: string;
  selectOrTypeCategoryPlaceholder: string;
  retailPricePack: string;
  retailPriceFractional: string;
  retailPriceLabel: string;
  costPricePack: string;
  costPriceFractional: string;
  grossMarginLabel: string;
  profitLabel: string;
  taxMozambique: string;
  taxBase: string;
  unitPriceIndicator: string;
  unitCostIndicator: string;
  initialStockPack: string;
  initialStockFractional: string;
  initialStockUnit: string;
  usePackageTotalQty: string;
  minStockAlertFractional: string;
  minStockAlertLabel: string;
  linkedStockPackDesc: string;
  standalonePackDescWithStock: string;
  standalonePackDescNoStock: string;
  packTypeLabel: string;
  unitsPerPack: string;
  parentProductLabel: string;
  selectParentProduct: string;
  linkedStockDesc: string;
  autoDeductHelp: string;
  volumeDiscountBadge: string;
  theoreticalPriceLabel: string;
  savingsLabel: string;
  bulkSaleTitle: string;
  unitOfMeasurement: string;
  packageTotalSize: string;
  packageTotalCost: string;
  packageTotalPrice: string;
  packageEstimateCalc: string;
  packageEnterTotalHint: string;
  autoCalculateUnitPricesBtn: string;
  promoSectionTitle: string;
  promoPriceLabel: string;
  customAttributesTitle: string;
  customAttributesUnlimited: string;
  attributeKeyPlaceholder: string;
  attributeValuePlaceholder: string;
  removeAttributeTooltip: string;

  // Alerts & Toasts
  nameRequired: string;
  priceRequired: string;
  productCreatedSuccess: string;
  productUpdatedSuccess: string;
  productDeletedSuccess: string;
  barcodeGeneratedSuccess: string;
  errorCreatingProduct: string;
  errorUpdatingProduct: string;
  errorDeletingProduct: string;
  deleteConfirmTitle: string;
  deleteConfirmMsg: string;
  bulkDeleteConfirmTitle: string;
  bulkDeleteConfirmMsg: string;
  justificationPlaceholder: string;
  quickStockSuccess: string;
  quickStockError: string;
  importSuccess: string;
  importError: string;
}

export interface PosTranslations {
  cart: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  checkout: string;
  cash: string;
  mpesa: string;
  emola: string;
  card: string;
  change: string;
  amountReceived: string;
  paymentSuccess: string;
  receipt: string;
  printReceipt: string;
  newSale: string;
  emptyCart: string;
  [key: string]: any;
}

export interface CustomersTranslations {
  title: string;
  newCustomer: string;
  customerName: string;
  phone: string;
  address: string;
  debt: string;
  creditLimit: string;
  repayDebt: string;
  debtHistory: string;
  totalDebt: string;
  [key: string]: any;
}

export type AuditsTranslations = Record<string, string>;

export type SettingsTranslations = Record<string, string>;

export type DeliveriesTranslations = Record<string, string>;
export type BarcodeTranslations = Record<string, string>;
export type EmployeesTranslations = Record<string, string>;
export type CashierControlTranslations = Record<string, string>;
export type ShiftReportsTranslations = Record<string, string>;
export type ScanHistoryTranslations = Record<string, string>;

export interface LocaleResource {
  common: CommonTranslations;
  products: ProductTranslations;
  pos: PosTranslations;
  customers: CustomersTranslations;
  audits: AuditsTranslations;
  settings: SettingsTranslations;
  deliveries: DeliveriesTranslations;
  barcodes: BarcodeTranslations;
  employees: EmployeesTranslations;
  cashierControl: CashierControlTranslations;
  shiftReports: ShiftReportsTranslations;
  scanHistory: ScanHistoryTranslations;
}
