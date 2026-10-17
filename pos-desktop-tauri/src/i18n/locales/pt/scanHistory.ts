export const ptScanHistory: Record<string, string> = {
  // Topbar / Header
  backTooltip: 'Voltar',
  headerTitle: 'Registo de Atividade & Scans',
  headerTitleWithUser: 'Histórico de Scans: {name}',
  proPlanBadge: 'Plano Pro',
  scansRecorded: '{count} bips registados',
  operatorsCount: '{count} operadores',
  operatorsSingular: '{count} operador',
  globalRevenue: 'Receita Global:',
  guideTooltip: 'Guia Explicativo para Administradores',
  loading: 'Carregando auditoria de scans...',

  // Subscription Locked Feature
  lockExclusive: 'Recurso Exclusivo Pro & Enterprise',
  lockTitle: 'Auditoria Forense de Leituras (Anti-Furto)',
  lockDesc: 'O acesso cronológico de todos os códigos de barras bipados por operador, tempos de atendimento e conciliação de gaveta faz parte do plano Pro.',
  lockFeature1Title: 'Registo de Cada Bip',
  lockFeature1Desc: 'Timestamp exato e produto registado no leitor.',
  lockFeature2Title: 'Ranking por Operador',
  lockFeature2Desc: 'Métricas comparativas de faturamento e volume.',
  lockFeature3Title: 'Rastreio de Saídas',
  lockFeature3Desc: 'Auditoria de sangrias e retiradas de gaveta.',
  lockFeature4Title: 'Prevenção Anti-Fraude',
  lockFeature4Desc: 'Evite quebras de stock e faturamentos omitidos.',
  btnBackToPanel: 'Voltar ao Painel',
  btnUnlockPro: 'Desbloquear com Pro / Enterprise',

  // Operator Table Toolbar
  searchOperatorPlaceholder: 'Pesquisar por operador ou ID...',
  sortBy: 'Ordenar:',
  sortSalesDesc: 'Maior Receita',
  sortScansDesc: 'Mais Bips',
  sortNameAsc: 'Nome (A-Z)',
  operatorBadgeSingular: 'Operador',
  operatorBadgePlural: 'Operadores',
  totalBips: 'Total Bips:',

  // Operator Table Content
  noOperatorsFound: 'Nenhum operador encontrado',
  adjustSearch: 'Tente ajustar a sua pesquisa.',
  thOperatorPerf: 'Operador / Desempenho',
  thScansItems: 'Bips / Artigos',
  thValuesByMethod: 'Valores por Método (MT)',
  thPayouts: 'Saídas',
  thTotalRevenue: 'Receita Total',
  syncedCloud: 'Sincronizado com a Nuvem',
  syncPending: 'Pendente de sincronização',
  topSeller: 'Top',
  bipsCount: '{count} bips',
  itemsCount: '{count} itens',
  singleItem: '{count} item',
  payoutsCountSingular: '{count} saída',
  payoutsCountPlural: '{count} saídas',

  // Operator Details Toolbar & Subtabs
  tabSalesScans: 'Vendas / Bips ({count})',
  tabPayouts: 'Saídas ({count})',
  searchScansPlaceholder: 'Pesquisar produto ou código bip...',
  searchPayoutsPlaceholder: 'Pesquisar motivo ou observação...',
  filterAll: 'Todos',
  filterCash: 'DIN',
  filterMpesa: 'MPS',
  filterEmola: 'EML',
  filterFiado: 'FIA',
  subtotal: 'Subtotal:',
  sortNewest: 'Mais Recentes',
  sortOldest: 'Mais Antigos',

  // Operator Details Scans Table
  noScansFound: 'Nenhum registo de bip encontrado',
  noScansDesc: 'Tente ajustar a sua pesquisa ou filtros de pagamento.',
  thItemBarcode: 'Artigo / Código Bip',
  thQuantity: 'Quantidade',
  thPaymentMethod: 'Método Pagamento',
  thTotalValue: 'Valor Total (MT)',
  thTime: 'Hora',
  unregisteredProduct: 'Produto Não Registado',
  todayAt: 'Hoje, {time}',

  // Operator Details Payouts Table
  noPayoutsFound: 'Nenhum levantamento de caixa',
  noPayoutsDesc: 'Este operador ainda não realizou saídas de dinheiro.',
  thReasonCategory: 'Motivo / Categoria',
  thNotes: 'Observações',
  thWithdrawnAmount: 'Valor Retirado',
  thDateTime: 'Data / Hora',
  noNotes: 'Sem observações',

  // Payment Badges
  badgeCash: 'Dinheiro',
  badgeMpesa: 'M-Pesa',
  badgeEmola: 'e-Mola',
  badgeFiado: 'Fiado',

  // Pagination
  paginationShowing: 'A mostrar',
  paginationTo: 'a',
  paginationOf: 'de',
  paginationOperators: 'operadores',
  paginationRecords: 'registos',
  prevBtn: 'Anterior',
  nextBtn: 'Seguinte',

  // Guide Modal
  guideModalTitle: 'Guia de Histórico de Leituras & Vendas',
  guidePageOf: 'Página {current} de {total}',
  guideModalSubtitle: 'Rastreio de códigos de barras, fluxo de pagamentos e auditoria de caixa',
  guideCloseBtn: 'Fechar',

  // Page 1
  page1SectionTitle: '1. Telemetria de Leituras (Bips) & Vendas',
  page1SectionDesc: 'Cada produto passado no leitor ótico (scanner de código de barras) ou digitado manualmente é auditado com precisão de segundos.',
  page1Card1Badge: 'Bip Automático',
  page1Card1Title: 'Scanner Ótico USB',
  page1Card1Desc: 'Identifica produtos instantaneamente. Regista o código exato lido, hora da leitura e quantidade adicionada ao carrinho.',
  page1Card2Badge: 'Vendas & Transações',
  page1Card2Title: 'Associação de Recibos',
  page1Card2Desc: 'Associa cada leitura ao operador de caixa responsável e à respetiva venda finalizada no terminal POS.',
  page1Card3Badge: 'Filtro de Leitura',
  page1Card3Title: 'Sucesso vs Falha',
  page1Card3Desc: 'Ajuda a detetar códigos não cadastrados ou tentativas de leitura rejeitadas para auditoria de catálogo.',

  // Page 2
  page2SectionTitle: '2. Saldo Físico do Gaveteiro & Métodos de Pagamento',
  page2SectionDesc: 'O sistema separa rigorosamente o que entrou em dinheiro vivo (gaveteiro) das transações eletrónicas e a prazo.',
  page2Card1Badge: 'Saldo Físico (Gaveta)',
  page2Card1Title: 'Dinheiro DIN - Saídas',
  page2Card1Desc: 'Fórmula: DIN (Numerário) - Saídas. É exatamente o valor monetário que deve constar fisicamente na gaveta.',
  page2Card2Badge: 'M-Pesa & E-Mola',
  page2Card2Title: 'Carteiras Móveis',
  page2Card2Desc: 'Pagamentos móveis são creditados na conta digital da loja e não interferem na conferência do dinheiro físico.',
  page2Card3Badge: 'Vendas Fiado / Conta',
  page2Card3Title: 'Crédito a Clientes',
  page2Card3Desc: 'Contabilizado nas estatísticas de vendas, mas segregado do valor de liquidação imediata da gaveta.',

  // Page 3
  page3SectionTitle: '3. Saídas de Caixa (Sangrias) & SQLite Offline',
  page3SectionDesc: 'Transparência total em despesas operacionais e armazenamento 100% offline garantido no SQLite local.',
  page3Card1Badge: 'Saídas de Caixa',
  page3Card1Title: 'Sangrias & Despesas',
  page3Card1Desc: 'Registo de retiradas com motivo (fornecedores, trocos, despesas miúdas), abatendo diretamente do saldo em dinheiro.',
  page3Card2Badge: 'SQLite Offline-First',
  page3Card2Title: 'Resiliência Total',
  page3Card2Desc: 'Todas as leituras e transações são gravadas instantaneamente no banco de dados local. Nenhuma leitura é perdida sem internet.',
  page3Card3Badge: 'Sincronização em Nuvem',
  page3Card3Title: 'Backup em Segundo Plano',
  page3Card3Desc: 'Assim que a conectividade estiver estável, o motor de sincronização envia os lotes para o Supabase sem travar o POS.',

  // Guide Footer
  dontShowAgain: 'Não mostrar novamente',
  prevSlide: 'Anterior',
  nextSlide: 'Seguinte',
  understoodClose: 'Entendido'
};

export default ptScanHistory;
