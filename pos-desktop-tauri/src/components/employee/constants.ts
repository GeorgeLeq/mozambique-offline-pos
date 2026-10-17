import { 
  Package, Barcode, Users, FileText, Activity, Scan, PlusSquare, Settings, ShieldAlert, Shield, Eye,
  LayoutDashboard, ShieldCheck, History
} from 'lucide-react';
import { PermissionItem } from './types';
import { EmployeesTranslations } from '../../i18n/types';

export const AVAILABLE_PERMISSIONS: PermissionItem[] = [
  { 
    id: 'dashboard', 
    label: 'Painel Principal', 
    desc: 'Visualização de métricas de vendas, gráficos de receita diária e faturação em tempo real.', 
    accessSummary: 'Acesso total a gráficos analíticos de faturação, receita diária e KPIs comerciais.',
    category: 'financeiro',
    icon: LayoutDashboard 
  },
  { 
    id: 'bypass_blind_close', 
    label: 'Burlar Fecho Cego', 
    desc: 'Permite fechar o turno diretamente sem a obrigatoriedade de contagem física cega de dinheiro.', 
    accessSummary: 'Encerramento de caixa direto com visualização do valor do sistema sem contagem cega prévia.',
    category: 'seguranca',
    icon: ShieldCheck 
  },
  { 
    id: 'products', 
    label: 'Catálogo de Produtos', 
    desc: 'Criar, alterar preços, definir margens de lucro e gerir categorias de artigos.', 
    accessSummary: 'Criação de novos artigos, edição de preços de venda, margens de lucro e gestão de stock.',
    category: 'catalogo',
    icon: Package 
  },
  { 
    id: 'orders', 
    label: 'Ordens de Compra (PO)', 
    desc: 'Criar e gerir encomendas a fornecedores e receção de mercadorias no armazém.', 
    accessSummary: 'Emissão de encomendas a fornecedores e conferência física de mercadorias faturadas.',
    category: 'operacoes',
    icon: PlusSquare 
  },
  { 
    id: 'history', 
    label: 'Histórico & Lixeira', 
    desc: 'Consultar histórico de receções de stock, devoluções e restaurar produtos da lixeira.', 
    accessSummary: 'Consulta de histórico de entradas de artigos e restauração de produtos removidos.',
    category: 'operacoes',
    icon: History 
  },
  { 
    id: 'barcodes', 
    label: 'Impressão de Etiquetas', 
    desc: 'Gerar e imprimir códigos de barras EAN-13 e etiquetas autocolantes de prateleira.', 
    accessSummary: 'Impressão de etiquetas de prateleira com preços atualizados e códigos de barras.',
    category: 'catalogo',
    icon: Barcode 
  },
  { 
    id: 'clients', 
    label: 'Gestão de Clientes', 
    desc: 'Registar clientes, consultar contas correntes e gerir limites de crédito.', 
    accessSummary: 'Registo de contas correntes fiadas, limites de crédito e receção de amortizações.',
    category: 'financeiro',
    icon: Users 
  },
  { 
    id: 'reports', 
    label: 'Relatórios Financeiros', 
    desc: 'Aceder a relatórios detalhados de faturação, lucros, sangrias e movimentos de caixa.', 
    accessSummary: 'Geração de mapas X/Z, relatórios de rentabilidade líquida e extratos de sangria.',
    category: 'financeiro',
    icon: FileText 
  },
  { 
    id: 'audit', 
    label: 'Auditoria de Ações', 
    desc: 'Consultar registos de segurança, auditoria de turnos e rastreio de operações de utilizadores.', 
    accessSummary: 'Rastreio forense de anulações, descontos e registo cronológico de segurança no POS.',
    category: 'seguranca',
    icon: Activity 
  },
  { 
    id: 'scans', 
    label: 'Contagem & Scans', 
    desc: 'Efetuar auditoria física e contagem de inventário com leitor de códigos de barras.', 
    accessSummary: 'Contagem física rápida com bipagem contínua para apuramento de quebras de inventário.',
    category: 'operacoes',
    icon: Scan 
  },
  { 
    id: 'restock', 
    label: 'Reposição de Stock', 
    desc: 'Dar entrada rápida de artigos e repor quantidades físicas em prateleiras e armazém.', 
    accessSummary: 'Entrada rápida de fardos e reposição imediata de mercadorias em loja.',
    category: 'operacoes',
    icon: PlusSquare 
  },
  { 
    id: 'settings', 
    label: 'Configurações Globais', 
    desc: 'Configurar dados do estabelecimento, impressoras térmicas, moedas e taxas de IVA.', 
    accessSummary: 'Ajuste de periféricos (impressoras térmicas 80mm/58mm), dados fiscais e sistema.',
    category: 'seguranca',
    icon: Settings 
  },
  { 
    id: 'refunds', 
    label: 'Reembolsos & Anulações', 
    desc: 'Autorizar devoluções de artigos, anulações de faturas e estornos de valores no POS.', 
    accessSummary: 'Autorização e devolução de artigos ao stock com estorno financeiro ao cliente.',
    category: 'vendas',
    icon: ShieldAlert 
  },
  { 
    id: 'supervisor', 
    label: 'Supervisão de Caixa', 
    desc: 'Autorizar quebras de preço, descontos manuais e divergências de contagem no ponto de venda.', 
    accessSummary: 'Validação de descontos percentuais manuais e quebra de preço autorizada no POS.',
    category: 'vendas',
    icon: Shield 
  },
  { 
    id: 'stock_checker', 
    label: 'Consulta de Stock', 
    desc: 'Consultar preços, localizações e disponibilidade de stock em modo exclusivo de leitura.', 
    accessSummary: 'Consulta rápida de preços e existências em prateleira sem permissão de alteração.',
    category: 'catalogo',
    icon: Eye 
  },
];

export function getAvailablePermissions(t?: EmployeesTranslations): PermissionItem[] {
  if (!t) return AVAILABLE_PERMISSIONS;
  return AVAILABLE_PERMISSIONS.map(p => ({
    ...p,
    label: (t as any)[`perm_${p.id}_label`] || p.label,
    desc: (t as any)[`perm_${p.id}_desc`] || p.desc,
    accessSummary: (t as any)[`perm_${p.id}_access`] || p.accessSummary
  }));
}

