export const audits: Record<string, string> = {
  // Header
  title: 'Auditoria do Sistema',
  immutableBadge: 'Logs Imutáveis',
  backToPanel: 'Voltar ao Painel',
  cloudActive: 'Nuvem Ativa',
  localFile: 'Arquivo Local',
  localShort: 'Local',
  cloudActiveTooltip: 'Backup Contínuo em Nuvem Ativo (Plano Pago)',
  localFileTooltip: 'Arquivo Local no SQLite (Clique para ver detalhes do plano com backup em nuvem)',
  exportCsv: 'Exportar CSV',
  exportCsvTooltip: 'Exportar registos para CSV',
  refreshTooltip: 'Atualizar Registos',
  guideTooltip: 'Guia de Auditoria e Segurança',

  // Subscription Lock Modal
  cloudBackupTitle: 'Backup e Sincronização em Nuvem',
  cloudBackupDesc: 'A cópia de segurança em nuvem e histórico perpétuo de auditoria está disponível nos planos pagos. No modo gratuito, todos os registos são mantidos localmente e com total segurança no SQLite do dispositivo.',

  // Summary Cards
  cardTotalLogs: 'Total Registos',
  infoTotalLogs: 'Informações sobre Registos',
  unitActions: 'ações',
  noteSqliteAudited: 'Base SQLite auditada',

  cardTodayLogs: 'Hoje',
  infoTodayLogs: 'Informações sobre Eventos de Hoje',
  unitToday: 'hoje',
  noteSessionsSales: 'Sessões & Vendas',

  cardOperators: 'Operadores',
  infoOperators: 'Informações sobre Operadores',
  unitUsers: 'utilizadores',
  noteIndividualTracking: 'Rastreio individual',

  cardCriticalActions: 'Ações Críticas',
  infoCriticalActions: 'Informações sobre Ações Críticas',
  unitAlerts: 'alertas',
  noteReversalsPermissions: 'Estornos / Permissões',

  cardCloudBackup: 'Backup Cloud',
  cloudBackupActive: 'Nuvem Ativa',
  cloudBackupLocal: 'Arquivo Local',
  autoBackupLabel: 'Backup Automático',
  freeModeLockedLabel: 'Modo Grátis (Bloqueado)',

  cardIntegrity: 'Integridade',
  integrityValue: '100% Íntegro',
  noteSha256Verified: 'SHA-256 Verificado',

  // Toolbar
  catAll: 'Todos',
  catProducts: 'Produtos',
  catSales: 'Vendas',
  catSessionLogin: 'Sessão / Login',
  catOperatorsCashier: 'Operadores & Caixa',
  catRestock: 'Reabastecimento',

  dateAll: 'Todas as datas',
  dateToday: 'Hoje',
  dateWeek: 'Últimos 7 dias',
  dateMonth: 'Últimos 30 dias',

  showSummary: 'Mostrar Resumo',
  hideSummary: 'Ocultar Resumo',
  showSummaryTooltip: 'Mostrar cartões de métricas',
  hideSummaryTooltip: 'Ocultar cartões de métricas',

  searchPlaceholder: 'Pesquisar ação, operador, ID...',

  // Table State
  loadingLogs: 'A carregar registos de auditoria...',
  noLogsFiltered: 'Nenhum registo encontrado com os filtros aplicados',
  noLogsSystem: 'Nenhum registo de auditoria no sistema',
  adjustSearchHint: 'Tente redefinir os filtros ou alterar os termos da pesquisa.',

  // Table Headers
  thLogAction: 'Registo / Ação',
  thOperator: 'Operador',
  thCategory: 'Categoria',
  thOperationDetails: 'Detalhes da Operação',
  thDateTime: 'Data & Hora',
  thCloudStatus: 'Status Nuvem',
  thActions: 'Ações',

  // Table Badges & Sync
  syncCloudTooltip: 'Sincronizado na nuvem / SQLite',
  syncPendingTooltip: 'Registo local pendente de backup na nuvem',
  syncedCloudLabel: 'Sincronizado na nuvem',
  storedSqliteLabel: 'Armazenado no SQLite',
  systemOperator: 'Sistema',
  viewDetailsTooltip: 'Ver detalhes do registo de auditoria',

  // Table Pagination
  paginationShowing: 'A mostrar',
  paginationTo: 'a',
  paginationOf: 'de',
  paginationRecords: 'registos',
  paginationFilteredFrom: '(filtrados de {0})',
  prevBtn: 'Anterior',
  nextBtn: 'Seguinte',

  // Detail Modal
  modalDetailTitle: 'Detalhes do Registo de Auditoria',
  modalIdLabel: 'ID:',
  modalExecutedAction: 'Ação Executada',
  modalSyncedCloud: 'Sincronizado na Nuvem',
  modalStoredSqlite: 'Armazenado no SQLite',
  modalResponsibleOperator: 'Operador Responsável',
  modalExactDateTime: 'Data & Hora Exata',
  modalFullDescription: 'Descrição Completa & Metadados',
  modalSha256Signature: 'Assinatura Criptográfica SHA-256',
  modalCopyBtn: 'Copiar',
  modalCopiedToast: '{field} copiado para a área de transferência',
  modalNoDetails: 'Sem detalhes registados.',
  modalCloseBtn: 'Fechar',

  // Guide Modal
  guideTitle: 'Guia de Auditoria & Segurança',
  guideSubtitle: 'Transparência, integridade imutável e backup em nuvem',
  guideWhatIsTitle: 'O que é o Módulo de Auditoria?',
  guideWhatIsDesc: 'O módulo de auditoria regista automaticamente todas as operações críticas do sistema (vendas, estornos, sangrias de caixa, alterações de operadores, descontos e permissões) de forma cronológica e à prova de adulteração.',
  guideItem1Title: '1. Registo Offline-First em SQLite',
  guideItem1Desc: 'Todos os eventos são gravados instantaneamente na base de dados SQLite local, garantindo zero latência de venda mesmo sem internet.',
  guideItem2Title: '2. Backup & Arquivo em Nuvem (Plano Pago)',
  guideItem2Desc: 'Com o módulo de Arquivo em Nuvem ativado, os registos são sincronizados com o Supabase para armazenamento perpétuo e relatórios remotos no Command Central. No modo gratuito, os logs permanecem seguros no dispositivo local.',
  guideItem3Title: '3. Assinatura Criptográfica SHA-256',
  guideItem3Desc: 'Cada entrada gera uma assinatura criptográfica com referência ao evento anterior, formando uma cadeia imutável que deteta qualquer tentativa de edição manual do banco de dados.',
  guideUnderstoodBtn: 'Entendido'
};

export default audits;
