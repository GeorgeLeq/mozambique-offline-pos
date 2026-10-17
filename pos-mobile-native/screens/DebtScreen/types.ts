export interface Debt {
  id: string;
  shop_id: string;
  customer_name: string;
  amount_mt: number;
  status: 'unpaid' | 'paid';
  phone_number?: string;
  address?: string;
  payment_method?: string;
  created_at: string;
  paid_at?: string;
  receipt_id?: string;
  cashier_name?: string;
  items_json?: string;
}

export interface DebtPayment {
  id: string;
  shop_id: string;
  debt_id: string;
  amount_mt: number;
  payment_method: string;
  created_at: string;
  receipt_id?: string;
  cashier_name?: string;
}
