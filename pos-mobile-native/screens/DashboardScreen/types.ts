export interface ShopData {
  id: string;
  name: string;
  code: string;
  companion_app_enabled?: boolean;
  companion_app_expires_at?: string | null;
  live_metrics?: LiveMetricsData | null;
}

export interface LiveMetricsData {
  date?: string;
  sales_count?: number;
  base_cash_mt?: number;
  live_cash_mt?: number;
  card_sales_mt?: number;
  cash_sales_mt?: number;
  emola_sales_mt?: number;
  mpesa_sales_mt?: number;
  other_sales_mt?: number;
  last_updated_at?: string;
  payouts_total_mt?: number;
  pending_debts_mt?: number;
  today_revenue_mt?: number;
  average_ticket_mt?: number;
  pending_debts_count?: number;
}

export interface DashboardMetrics {
  receitaTotal: number;
  dinheiroVivo: number;
  mpesa: number;
  emola: number;
  cardSales: number;
  otherSales: number;
  dinheiroEmCaixa: number;
  baseCash: number;
  totalPayouts: number;
  salesCount: number;
  averageTicket: number;
  pendingDebtsMt: number;
  pendingDebtsCount: number;
  lastUpdatedAt?: string;
  date?: string;
  rawLiveMetrics?: LiveMetricsData | null;
}

export interface Employee {
  id: string;
  shop_id: string;
  name: string;
  role?: string;
  phone_number?: string;
  is_blocked?: boolean;
  current_shift_start?: string;
  created_at?: string;
}

export interface DashboardScreenProps {
  shopData: ShopData;
  onLogout: () => void;
  onViewAllEmployees: () => void;
  onOpenAnnouncement?: (targetCashier?: { id: string; name: string; role?: string } | null) => void;
  onViewDeliveries?: () => void;
}
