export interface SaleItem {
  id: string | number;
  product_id?: string;
  product_name: string;
  barcode?: string;
  quantity: number;
  total_mt: number;
  status?: string;
  price?: number;
  created_at?: string;
}

export interface SaleReceipt {
  receipt_id: string;
  created_at: string;
  payment_method: string;
  status?: string;
  sync_status?: number;
  customer_name?: string;
  total: number;
  items: SaleItem[];
}

export type PaymentFilterType = 'all' | 'cash' | 'mpesa' | 'emola' | 'fiado' | 'mixed';

export type TimeFilterType = 
  | 'all' 
  | 'today_morning' 
  | 'today_afternoon' 
  | 'today_night' 
  | 'yesterday_morning' 
  | 'yesterday_afternoon' 
  | 'yesterday_night' 
  | 'last_2_days' 
  | 'last_7_days' 
  | 'last_15_days';

export type PruneOptionType = '24h' | '3d' | '7d' | 'all';

export interface RecentSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}
